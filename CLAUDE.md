# CLAUDE.md — Variable Star Photometry

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

SceneryStack port of the NAAP Variable Star Photometry Lab. Students work through a four-screen
workflow to discover a variable star's period: align CCD frames (Registration), identify the
variable by blinking (Blink Comparator), measure differential magnitudes (Photometry), and
determine the period via PDM analysis (Analyzer).

## Key files

| File | Purpose |
|---|---|
| `src/VSPColors.ts` | All `ProfileColorProperty` instances (default + projector profiles) |
| `src/VSPConstants.ts` | Named numeric constants grouped by concern (FIELD, APERTURE, TIME, LAYOUT, FONT_SIZE) |
| `src/VSPNamespace.ts` | Namespace used by every class/object via `.register()` |
| `src/i18n/StringManager.ts` | Singleton localized string accessor; per-screen typed getters |
| `src/main.ts` | Entry point; registers all four screens with the Sim |
| `src/common/model/CCDField.ts` | Singleton; renders synthetic CCD `ImageData` per epoch (cached) |
| `src/common/model/StarFieldData.ts` | Star catalogue + 21 observation epoch records |
| `src/common/model/PDMCalculator.ts` | Pure Phase Dispersion Minimization computation |
| `src/common/view/ApertureNode.ts` | Draggable aperture + sky-annulus overlay node |
| `src/common/view/StarFieldNode.ts` | `CanvasNode` rendering a single observation epoch |
| `src/photometry/model/PhotometryModel.ts` | Aperture photometry state; `DerivedProperty` for net flux and Δm |
| `src/blink-comparator/model/BlinkComparatorModel.ts` | Epoch queue, blink timer, crosshair toggle |
| `src/analyzer/model/AnalyzerModel.ts` | Light-curve measurements, PDM scan, zoom history |
| `src/registration/model/RegistrationModel.ts` | Field overlay offsets, on-top index, invert/transparency flags |
| `src/preferences/vspQueryParameters.ts` | `QueryStringMachine` parameters (camelCase, lowercase-first filename) |
| `scripts/decompile-flash.ts` | Extract ActionScript from the NAAP Flash `.swf` sources via JPEXS FFDec (→ `NAAP/decompiled/`) |

## Screens

Four screens registered in `src/main.ts` in this order:

1. **Registration** (`src/registration/`) — overlay three CCD epochs and align them with XY offsets or arrow keys
2. **Blink Comparator** (`src/blink-comparator/`) — queue observations and blink through them to identify the variable
3. **Photometry** (`src/photometry/`) — place two apertures on variable and comparison stars; compute Δm per epoch
4. **Analyzer** (`src/analyzer/`) — plot the differential light curve and run PDM to find the period

## Notable deviations from TemplateSingleSim

### VSPConstants grouped-object pattern

`src/VSPConstants.ts` uses nested `as const` objects (`FIELD`, `APERTURE`, `TIME`, `LAYOUT`,
`FONT_SIZE`) rather than a single flat namespace. This is intentional: the domain has five distinct
concerns and flat-prefixed names (e.g. `FIELD_WIDTH`, `LAYOUT_SCREEN_MARGIN`) would be verbose.
All groups are frozen, so the convention of "no magic numbers in model or view" is still upheld.
The file lives at `src/` root as required by CONVENTIONS.md.

### ModelViewTransform2 is identity

Model and view share the same coordinate space: CCD pixel coordinates, 380 × 290 px, origin
top-left. A `ModelViewTransform2.createIdentity()` is used in `PhotometryScreenView` and
`AnalyzerScreenView` (passed to `ApertureNode` and used for selection-marker placement) to make
the model→view boundary explicit and allow future scale changes in one place. The transform is
also wired into `ApertureNode`'s `DragListener` via the `transform` option so drags update the
aperture `centerProperty` in model space. When a screen scales the star field (e.g., Blink
Comparator), it uses a SceneryStack scene-graph `scale()` — model coordinate values are unchanged.

## Physics notes

- Star brightness follows the magnitude/flux relation: Δm = −2.5 log₁₀(f₁/f₂)
- Sky background (sky annulus mean × disc pixel count) is subtracted before net flux is reported
- Period finding uses PDM: θ(T) = within-bin variance / total variance; minimum θ = best period
- The target variable is based on δ Cephei; the dataset spans ~21 days, covering multiple periods

## Accessibility

The sim ships with PDOM names and `ResetAllButton` instrumented with tandem. Full a11y wiring
(screen summary, `pdomOrder`, keyboard help, `accessibleName` on interactive nodes) is in progress.
Conventions: [../Baton/ACCESSIBILITY.md](../Baton/ACCESSIBILITY.md).

## Decompiling the Flash sources

`npm run decompile` (script: `scripts/decompile-flash.ts`) extracts readable ActionScript
from the NAAP Flash movies so the ported photometry can be diffed against the originals.
The `.fla` files are old binary (OLE compound) projects no tool reads directly, so the
script decompiles their sibling compiled `.swf` (passing a `.fla` resolves to its `.swf`
automatically) via **JPEXS FFDec**. See `PORTING_PLAN.md` → "Flash simulator inventory" for
the screen→SWF mapping.

```sh
npm run decompile                 # the four VSP simulators → NAAP/decompiled/<name>/scripts/*.as
npm run decompile -- --all        # all VSP-relevant movies (curated list below)
npm run decompile -- --list       # dry run: print what would be decompiled, run nothing
npm run decompile -- <path>…      # specific .swf / .fla / folder
npm run decompile -- --assets     # also export images/shapes/sounds/text
npm run decompile -- --xfl        # reconstruct an editable XFL project (closest to the .fla)
```

Output goes to `NAAP/decompiled/` (git-ignored). **One-time setup** — FFDec needs a Java
runtime:

```sh
sudo apt install default-jre               # Debian/WSL (or: brew install temurin on macOS)
npm run decompile -- --setup               # downloads FFDec into tools/ffdec/ (git-ignored)
# …or point at an existing install instead: export FFDEC_JAR=/path/to/ffdec.jar
```

Run `npm run decompile -- --help` for all flags. The decompiled AS is a **read-only
reference** (AS2/AS3, lightly mangled by the compiler) — transcribe the maths into typed TS
in `src/`; don't vendor it. By default the four primary simulators decompile (one per
screen): `registrationSimulator`, `blinkComparatorSimulator`, `photometrySimulator`, and
`variableStarPhotometryAnalyzer`. The curated `--all` set adds the CCD background reading
(`CCDMiniSim3`), the reusable components (`lightcurveComponentII`, `starFieldComponent`),
and the concept demos (`variableStarCurves`, `sinusoidLightcurveQuestion`,
`snCurveExplorer`).
