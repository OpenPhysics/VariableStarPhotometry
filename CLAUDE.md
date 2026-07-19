# CLAUDE.md — Variable Star Photometry

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

SceneryStack port of the NAAP **Variable Star Photometry** lab. Four screens walk through a CCD photometry workflow to find a pulsating star's period (based on **δ Cephei**): align frames, blink to identify the variable, measure differential magnitudes, and run PDM analysis. Architecture and formulas: [doc/model.md](doc/model.md), [doc/implementation-notes.md](doc/implementation-notes.md).

- **Registration** (`src/registration/`) — overlay and align three fixed CCD epochs.
- **Blink Comparator** (`src/blink-comparator/`) — queue observations and blink through them.
- **Photometry** (`src/photometry/`) — dual apertures, net flux, Δm per epoch.
- **Analyzer** (`src/analyzer/`) — light curve plot and Phase Dispersion Minimization scan.

## Key files

| Area | Location |
|---|---|
| Screens | `src/registration/RegistrationScreen.ts`, `src/blink-comparator/BlinkComparatorScreen.ts`, `src/photometry/PhotometryScreen.ts`, `src/analyzer/AnalyzerScreen.ts` |
| Shared model | `src/common/model/StarFieldData.ts`, `LightCurveLibrary.ts`, `CCDField.ts`, `AperturePhotometry.ts`, `PDMCalculator.ts` |
| Shared views | `src/common/view/StarFieldNode.ts`, `ApertureNode.ts`, `FieldGridNode.ts`, `VariableStarPhotometryKeyboardHelpContent.ts` |
| Per-screen models | `registration/model/RegistrationModel.ts`, `blink-comparator/model/BlinkComparatorModel.ts`, `photometry/model/PhotometryModel.ts`, `analyzer/model/AnalyzerModel.ts` |
| Colors / constants | `src/VariableStarPhotometryColors.ts`, `src/VariableStarPhotometryConstants.ts` |
| Strings | `src/i18n/StringManager.ts` |
| Preferences / query params | `src/preferences/variableStarPhotometryQueryParameters.ts` (`showGrid`, `invertImages`, blink interval, aperture diameter, trial period, light-curve mode) |
| Entry | `src/main.ts` |

## Model

Four **independent** screen models — **no cross-screen state** (registration offsets, blink queue, aperture positions, and analyzer selections reset independently on each screen, matching standalone NAAP Flash labs).

| Screen | Model | Notes |
|---|---|---|
| **Registration** | `RegistrationModel` | Three **fixed** epoch indices with XY offsets (±100 px), on-top selection, transparency; arrow-key nudge |
| **Blink Comparator** | `BlinkComparatorModel` | Observation queue + blink timer; default queue `[0, 36]`; blinking advances in `step(dt)`, not `setInterval` |
| **Photometry** | `PhotometryModel` | Two draggable apertures; sky annulus subtraction; Δm = −2.5 log₁₀(f₁/f₂) on **raw counts** (before display γ) |
| **Analyzer** | `AnalyzerModel` | Light-curve measurements, PDM θ scan (minimum θ = best period), zoom history |

**Shared gotchas**

- Synthetic field: **380 × 290 px**, 26 stars, **109 epochs**; `CCDField` singleton caches `ImageData` per `(obsIndex, invert)` and stamps **Airy-disc** PSFs (not Gaussian).
- Model and view share **pixel coordinates** — `ModelViewTransform2.createIdentity()` in Photometry/Analyzer; Blink view may `scale(1.25)` on the view container only.
- Target variable **δ Cep** at pixel (308, 175); dataset spans ~1.72–21.99 days.

## Accessibility

Follows the shared [OpenPhysics accessibility convention](https://github.com/OpenPhysics/Baton/blob/main/ACCESSIBILITY.md).
Each screen registers `*ScreenSummaryContent` via its `*Screen.ts` wrapper and sets explicit `pdomOrder` on a wrapper `Node`. A11y strings live under `a11y.registration`, `a11y.blinkComparator`, `a11y.photometry`, and `a11y.analyzer` in each locale JSON, via `StringManager.getRegistrationA11yStrings()` / `getBlinkComparatorA11yStrings()` / `getPhotometryA11yStrings()` / `getAnalyzerA11yStrings()`. `ApertureNode` is keyboard-operable via `KeyboardDragListener` (arrow keys; Shift for fine steps).

## Testing

Fleet-standard Vitest layout:

| Path | Purpose |
|---|---|
| `vitest.config.ts` | **`jsdom` environment** (no `setupFiles`); `scenerystack` aliased to `scenerystack/dot`; `execArgv: ["--expose-gc"]` |
| `tests/**/*.test.ts` | Model/physics unit tests |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression (fleet pattern) |

| File | Covers |
|---|---|
| `AperturePhotometry.test.ts` | Net flux, differential magnitude |
| `PDMCalculator.test.ts` | NAAP θ scan, best period |
| `memory-leak.test.ts` | Dispose regression |

- Put unit tests only under root `tests/` (never co-locate or use `__tests__/`).
- Run `npm test`. CI runs the suite when a `test` script is present.
- Vitest environment: **`jsdom`** (not the fleet-default `happy-dom`) — photometry math needs
  browser globals without pulling the full SceneryStack barrel. Documented `setup.ts` carve-out
  per [Baton/CONVENTIONS.md](https://github.com/OpenPhysics/Baton/blob/main/CONVENTIONS.md) §5.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

## Development notes

- **`VariableStarPhotometryConstants.ts`** uses nested frozen `as const` groups (`FIELD`, `APERTURE`, `TIME`, `LAYOUT`, `PDM`) instead of a flat namespace — intentional for five distinct concerns; still no magic numbers in model/view code.
- **`npm run decompile`** extracts NAAP Flash ActionScript via JPEXS FFDec into gitignored `NAAP/decompiled/` — read-only reference.
- After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
