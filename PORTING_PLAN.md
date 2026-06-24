# Variable Star Photometry — Flash-to-SceneryStack Porting Plan

Source: `NAAP/astroUNL/naap/vsp/` (4 SWF files + settings.xml)  
Target: TypeScript + SceneryStack (Vite PWA, `src/`)
ALSO the very USEFUL NAAP/flash-source  for the fla files.

---

## What already exists

| File | Status |
|---|---|
| `main.ts` | Complete — 4 screens wired, preferences, credits |
| `VSPColors.ts` | Complete — default + projector profiles |
| `VSPConstants.ts` | Complete — matches settings.xml field params |
| `VSPNamespace.ts` | Complete |
| `brand.ts / splash.ts / init.ts / assert.ts` | Complete |
| `i18n/StringManager.ts` + `strings_*.json` | Complete — en/es/fr |
| `preferences/VSPPreferencesModel.ts` | Complete — showGrid, invertImages |
| `preferences/VSPPreferencesNode.ts` | Complete |
| `preferences/vspQueryParameters.ts` | Complete |
| `{screen}/model/*.ts` (×4) | Skeleton — Properties defined, logic TODO |
| `{screen}/view/*.ts` (×4) | Stub — placeholder Node + ResetAllButton only |
| `common/VSPConstants.ts` | Complete |
| `common/view/VSPKeyboardHelpContent.ts` | Stub — BasicActionsKeyboardHelpSection only |

---

## Flash simulator inventory

| SWF | Size | Screens in this port |
|---|---|---|
| `registrationSimulator.swf` | 850×600 | Screen 1: Registration |
| `blinkComparatorSimulator.swf` | ~850×600 | Screen 2: Blink Comparator |
| `photometrySimulator.swf` | 850×600 | Screen 3: Photometry |
| `variableStarPhotometryAnalyzer.swf` | 900×715 | Screen 4: Analyzer |
| `CCDMiniSim.swf` | 400×640 | Background reading only — not ported as a screen |
| `pulsatingstar.swf` | 150×150 | Decorative animation in HTML — not ported |

---

## Star-field data (from `animations/settings.xml`)

```
Field: 380×290 px  noiseMean=2300  noiseSigma=330
        saturationMagnitude=3  psfRadius=5

Stars (26 total):
  constantStar ×21   — fixed magnitude, no variability
  eclipsingBinary ×1 — TW_Cas  peakMagnitude=3.2   x=331 y=22
  pulsatingStar  ×4  — MT_Tel  centerMagnitude=4.2  x=64  y=113
                        del_Cep centerMagnitude=4.5  x=308 y=175
                        PZ_Aql  centerMagnitude=4.0  x=124 y=259
                        RR_Leo  centerMagnitude=3.7  x=131 y=201

Observations: 109 entries  epochs 1.72 – 21.99 days  each with noiseSeed
```

---

## Phase 1 — Shared data and rendering infrastructure

> All 4 screens depend on this layer. Build it first.

### 1.1  `src/common/model/StarFieldData.ts`

TypeScript encoding of `settings.xml`. No file I/O at runtime — hard-code as a
`const` object so the compiler can type-check accesses.

```typescript
export type ConstantStar  = { kind: 'constant';  magnitude: number; x: number; y: number };
export type EclipsingBinary = { kind: 'eclipsing'; peakMagnitude: number;
                                prototypeName: string; x: number; y: number };
export type PulsatingStar = { kind: 'pulsating'; centerMagnitude: number;
                              prototypeName: string; x: number; y: number };
export type StarDef = ConstantStar | EclipsingBinary | PulsatingStar;

export const FIELD_PARAMS = { noiseMean: 2300, noiseSigma: 330,
                               saturationMag: 3, psfRadius: 5 };
export const STARS: readonly StarDef[] = [ /* ... 26 entries ... */ ];
export const OBSERVATIONS: readonly { epoch: number; noiseSeed: number }[] =
  [ /* ... 109 entries ... */ ];
```

### 1.2  `src/common/model/LightCurveLibrary.ts`

Returns magnitude offset Δm(epoch) for each variable star prototype.
All functions must be pure (same epoch → same result).

**Prototype parameters to implement:**

| Prototype | Type | Period (days) | Amplitude (mag) | Shape |
|---|---|---|---|---|
| `del_Cep` | Cepheid | 5.3663 | 0.84 | steep rise, gradual fall; use Fourier template |
| `RR_Leo` | RR Lyrae ab | 0.4521 | 0.85 | fast rise from minimum, broad maximum |
| `PZ_Aql` | RR Lyrae c | 0.5717 | 0.42 | roughly sinusoidal |
| `MT_Tel` | RR Lyrae ab | 0.3170 | 0.55 | fast rise, intermediate |
| `TW_Cas` | Eclipsing binary | 1.3283 | primary Δm=0.9, secondary Δm=0.4 | trapezoidal eclipses |

Cepheid and RR Lyrae light curves can be parameterised with a Fourier series
of 4–6 terms fitted to published AAVSO data for each prototype.

```typescript
export function getMagnitudeOffset(prototypeName: string, epoch: number): number
```

### 1.3  `src/common/model/CCDField.ts`

Generates a 380×290 pixel RGBA buffer for a given observation epoch.

**Algorithm for each pixel (r,c):**
1. Start with sky background = `noiseMean` ADU
2. For each star at position (x,y) with magnitude m:
   - Compute brightness in ADU via the magnitude–counts relation:
     `peakCounts = C_ref × 10^(−0.4 × (m + Δm(epoch)))` where C_ref is
     calibrated so magnitude 3 saturates (≈65535 ADU after scaling).
   - Add Gaussian PSF contribution: `Δcounts(r,c) = peak × exp(−d²/(2σ²))`
     where `d = sqrt((c−x)²+(r−y)²)` and `σ = psfRadius / 2.355`.
   - Clamp pixel value to [0, 65535].
3. Add Poisson noise using the observation's `noiseSeed` (seeded PRNG so
   noise is reproducible across re-renders of the same epoch).
4. Optionally invert (65535 − value) for projector mode.
5. Map 16-bit value to 8-bit grey (value >> 8) for canvas rendering.

```typescript
export function renderField(epochIndex: number, invertColors?: boolean): ImageData
```

Cache rendered buffers keyed on `(epochIndex, invertColors)` to avoid
re-rendering on every frame repaint.

### 1.4  `src/common/view/StarFieldNode.ts`

A `CanvasNode` (SceneryStack) that:
- Holds a reference to a rendered `ImageData` from `CCDField`.
- On `paintCanvas(context)` draws the buffer at the node's local origin.
- Exposes `setEpochIndex(i)` which invalidates the canvas when the
  underlying `ImageData` changes.

---

## Phase 2 — Registration screen

**Flash behaviour:** Two star-field panels side by side.  
A "working" image can be shifted (±x, ±y) over a reference image using
number spinners and/or arrow keys. Three starfield slots are shown in the
control panel: starfield 1 is always the reference; 2 and 3 are working images
from different epochs. A transparency slider and an "invert colors" checkbox
are provided.

### 2.1  Extend `RegistrationModel`

Add:
```typescript
// Index of the epoch used as the fixed reference (always 0 in Flash)
public readonly referenceEpochIndexProperty: NumberProperty;   // 0

// Two selectable "working" epochs (indices into OBSERVATIONS)
public readonly workingEpochAIndexProperty: NumberProperty;    // default 1
public readonly workingEpochBIndexProperty: NumberProperty;    // default 2

// Which working image is currently on top (0=A, 1=B)
public readonly activeWorkingImageProperty: NumberProperty;

// Overlay offsets for each working image (in field pixels)
public readonly offsetAXProperty: NumberProperty;
public readonly offsetAYProperty: NumberProperty;
public readonly offsetBXProperty: NumberProperty;
public readonly offsetBYProperty: NumberProperty;

// 0.0 = opaque, 1.0 = fully transparent
public readonly overlayAlphaProperty: NumberProperty;
```

`step()` is still a no-op — all changes are user-driven.

### 2.2  Implement `RegistrationScreenView`

Layout:
```
┌─────────────────────────────────────────────────────────────────┐
│  StarFieldNode (reference)  │  StarFieldNode (working, offset)  │
│─────────────────────────────────────────────────────────────────│
│  Starfield Controls panel                                        │
│    starfield 1  [shown ☑]  [on top ○]  x: ──  y: ──             │
│    starfield 2  [shown ☑]  [on top ○]  x: -28  y: 34            │
│    starfield 3  [shown □]  [on top ○]  x: -27  y: 13            │
│  [switch on top field]  or press 'J'                             │
│─────────────────────────────────────────────────────────────────│
│  Appearance Options                                              │
│    [make top field transparent ☑]   [invert colors □]           │
│─────────────────────────────────────────────────────────────────│
│                                              [Reset All]         │
└─────────────────────────────────────────────────────────────────┘
```

Key implementation notes:
- Arrow keys increment offset by 1 pixel — attach a `KeyboardListener`
  to the ScreenView that increments the active working image's X/Y offset.
- The right-hand panel uses `StarFieldNode` with a CSS `transform` applied
  via SceneryStack's `matrix` option to shift by the current offset.
- Transparency is applied by setting `opacity` on the top `StarFieldNode`.

### 2.3  `VSPKeyboardHelpContent` — Registration section

Add a "Move Working Image" keyboard help section with arrow-key rows.

---

## Phase 3 — Blink Comparator screen

**Flash behaviour:** A single star-field panel. An observations list on the
right shows all 109 epoch values. Users move epochs into a "blinking queue".
The panel flips between the queued images at a configurable rate. A crosshair
follows the mouse cursor.

### 3.1  Extend `BlinkComparatorModel`

Add:
```typescript
// Queue of epoch indices to blink through (ordered)
public readonly blinkQueueProperty: ObservableArray<number>;

// Index into blinkQueue of the currently displayed frame
public readonly queuePositionProperty: NumberProperty;

// Whether the mouse-following crosshair is visible
public readonly showCrosshairProperty: BooleanProperty;
```

Update `step(dt)` to advance `queuePositionProperty` through the queue
(wrap around) when blinking is active and the interval has elapsed.

### 3.2  Implement `BlinkComparatorScreenView`

Layout:
```
┌──────────────────────────────────────────────────────────────────┐
│  StarFieldNode (current frame)     │  Blinking Queue Controls    │
│    epoch of field above: N.NNNN    │  observations list          │
│    [show crosshairs ☑]             │  ┌──────────┐              │
│                                    │  │ 1.7215   │  epoch        │
│                                    │  │ 1.7422   │  2.7660  ←   │
│                                    │  │ ...      │  2.1000      │
│                                    │  └──────────┘  ...         │
│                                    │  [add →] [← remove]        │
│                                    │  rate: ────────●────       │
│────────────────────────────────────│                             │
│  [Play/Pause]   blink speed ──●──  │                             │
│                                              [Reset All]         │
└──────────────────────────────────────────────────────────────────┘
```

Key implementation notes:
- `StarFieldNode` swaps its `ImageData` whenever `queuePositionProperty`
  changes — keep a `Map<number, ImageData>` cache in the model.
- The crosshair is a thin `+` shape drawn on a separate `Node` layer that
  tracks mouse position via a `MouseListener`.
- The observations list is a scrollable `VBox` of `TextPushButton`s.

---

## Phase 4 — Photometry screen

**Flash behaviour:** A 380×290 star field showing stars. Two draggable aperture
rings (labelled 1 and 2) can be placed on stars. Each aperture has an inner
disc (flux integration) and outer annulus (sky background estimation). The
info panels display disc/annulus pixel counts, average ADU, and the formula
`m₁ − m₂ = −2.5 log₁₀(f₁/f₂)`.

### 4.1  `src/common/model/AperturePhotometry.ts`

Pure functions — no state:

```typescript
/**
 * Sums pixel values within radius r of centre (cx, cy) in a rendered field.
 */
export function integrateAperture(
  field: ImageData, cx: number, cy: number, r: number
): { numPixels: number; totalCounts: number; averageCounts: number }

/**
 * Estimates sky background from the annulus between r1 and r2.
 */
export function measureSkyAnnulus(
  field: ImageData, cx: number, cy: number, r1: number, r2: number
): { numPixels: number; totalCounts: number; averageCounts: number }

/**
 * Computes differential instrumental magnitude.
 * f = disc_total - disc_npixels * sky_average_per_pixel
 * Δm = -2.5 * log10(f1 / f2)
 */
export function differentialMagnitude(
  f1: number, f2: number
): number
```

### 4.2  Extend `PhotometryModel`

Add:
```typescript
// Position of aperture 1 and 2 (field-pixel coordinates)
public readonly aperture1CenterProperty: Vector2Property;
public readonly aperture2CenterProperty: Vector2Property;

// Derived read-only measurements (recomputed on epoch or aperture change)
public readonly aperture1PhotometryProperty: ReadOnlyProperty<ApertureResult>;
public readonly aperture2PhotometryProperty: ReadOnlyProperty<ApertureResult>;
public readonly magnitudeDifferenceProperty: ReadOnlyProperty<number | null>;

// Label the apertures in the star field
public readonly labelAperturesProperty: BooleanProperty;
```

Use a `DerivedProperty` that calls the `AperturePhotometry` functions whenever
epoch index, aperture positions, or aperture/annulus sizes change.

### 4.3  Implement `PhotometryScreenView`

Layout:
```
┌───────────────────────────────────────────────────────────────────┐
│  Star Field (380×290)          │  Aperture 1 Info                 │
│  [draggable aperture rings]    │    Inner Disc: N px  NNNN counts │
│  [label the apertures ☑]       │    Outer Ring: N px  NNNN counts │
│                                │    centre: (x, y)                │
│                                │                                   │
│                                │  Aperture 2 Info                 │
│                                │    Inner Disc: N px  NNNN counts │
│                                │    Outer Ring: N px  NNNN counts │
│                                │    centre: (x, y)                │
│────────────────────────────────│                                   │
│  Magnitude Difference          │                                   │
│  f₁ = counts₁ − npx₁×avg₁     │                                   │
│  f₂ = counts₂ − npx₂×avg₂     │                                   │
│  m₁ − m₂ = -2.5 log₁₀(f₁/f₂) │                             [Reset]│
└───────────────────────────────────────────────────────────────────┘
```

Key implementation notes:
- Each aperture has two concentric `Circle` nodes (inner disc ring and annulus
  ring) and a drag handle. Use a `DragListener` clamped to field bounds.
- The info panels are read-only `Text` nodes bound to
  `aperture1PhotometryProperty`/`aperture2PhotometryProperty`.
- The magnitude difference formula panel uses `RichText` to render the
  subscripts and the log expression.

---

## Phase 5 — Analyzer screen

**Flash behaviour (most complex screen):**
- **Star Field** (top-left): click to designate a "star of interest" (green circle)
  and a "comparison star" (blue square). A crosshair follows the cursor.
- **Observations Plot** (top-right): after selecting star + comparison, differential
  magnitudes are plotted. Radio buttons switch between time (JD) and phase axes.
  An optional "show difference tool" drag bar lets students read off magnitudes.
- **PDM Plot** (bottom): θ vs trial period in days. Click-drag to zoom in.
  A vertical marker shows the current trial period. "Zoom in around period",
  "zoom out", "undo last zoom" buttons.

### 5.1  `src/common/model/PDMCalculator.ts`

Phase Dispersion Minimization (Stellingwerf 1978):

```typescript
/**
 * Computes the PDM theta statistic for a trial period.
 *
 * @param epochs  Array of Julian dates (days)
 * @param mags    Corresponding differential magnitudes
 * @param period  Trial period in days
 * @param nBins   Number of phase bins (default 5)
 * @returns theta ∈ [0, 1]; small θ → good period
 */
export function pdmTheta(
  epochs: number[], mags: number[], period: number, nBins = 5
): number

/**
 * Scans periods in [periodMin, periodMax] with nSteps steps.
 * Returns array of { period, theta } for plotting.
 */
export function pdmScan(
  epochs: number[], mags: number[],
  periodMin: number, periodMax: number, nSteps: number
): { period: number; theta: number }[]
```

**PDM formula:**
```
Bin j collects all points whose phase φ = ((t − t₀)/P mod 1) falls in
  [j/nBins, (j+1)/nBins).
σ²_j = variance of magnitudes within bin j   (sample variance, n_j − 1)
σ²   = variance of all magnitudes           (sample variance, N − 1)
θ    = Σ_j (n_j − 1) σ²_j  /  [(N − nBins) σ²]
```

### 5.2  Extend `AnalyzerModel`

Add:
```typescript
// Selected stars (field-pixel coordinates, null = not yet selected)
public readonly variableStarPositionProperty: Property<Vector2 | null>;
public readonly comparisonStarPositionProperty: Property<Vector2 | null>;

// Differential magnitude measurements (one per observation, NaN = unmeasured)
public readonly measurementsProperty: ReadOnlyProperty<readonly DiffMag[]>;
// DiffMag = { epoch: number; magnitude: number }

// Light-curve plot mode
public readonly lightCurveTypeProperty: StringUnionProperty<'time' | 'phase'>;

// PDM scan results (recomputed when measurements change)
public readonly pdmScanResultsProperty: ReadOnlyProperty<readonly PdmPoint[]>;
// PdmPoint = { period: number; theta: number }

// Current zoom window for the PDM plot
public readonly pdmZoomRangeProperty: Property<Range>;

// Zoom history stack (for "undo last zoom")
private readonly pdmZoomHistory: Range[];
```

**Measurement derivation:** a `DerivedProperty` that, for each observation in
`OBSERVATIONS`, renders the field (or reads from cache) and calls
`AperturePhotometry.differentialMagnitude()` using fixed aperture parameters
centred on the selected star positions. This can be lazy (compute only when
the user has selected both stars).

### 5.3  Implement `AnalyzerScreenView`

Layout:
```
┌─────────────────────────────────────────────────────────────────────┐
│  Star Field (380×220)            │  Observations Plot               │
│  x: NNN  y: NNN (crosshair)      │  ┌──────────────────────────┐   │
│                                  │  │   scatter plot             │   │
│  key: □ comparison  ○ variable   │  │   (mag diff vs JD/phase)   │   │
│       [show crosshairs ☑]        │  └──────────────────────────┘   │
│                                  │  light curve plot type: ○time ○phase │
│                                  │  [show difference tool □]        │
│──────────────────────────────────────────────────────────────────────│
│  PDM Plot and Period Selection                                        │
│  period: [5.3639] days                                               │
│  [zoom in around period]  [zoom out around period]                   │
│  [zoom out to full range]  [undo last zoom]                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │   θ  ▲                   PDM theta vs period                   │  │
│  │      │               ╲     /╲                                  │  │
│  │   1.0│────────────────╲───/──╲──────────────────────           │  │
│  │      │               ▼ ╲ /   ╲                                 │  │
│  │   0.5│                  V                                       │  │
│  │      └────────────────────────────────────────────────── days   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                         [Reset All]   │
└──────────────────────────────────────────────────────────────────────┘
```

Key implementation notes:
- **Star field**: `StarFieldNode` (epoch 0 used as reference view for star
  identification). Mouse click sets `variableStarPositionProperty` on first
  click and `comparisonStarPositionProperty` on second; green circle and blue
  square overlay nodes update via `link()`.
- **Observations plot**: Use SceneryStack `bamboo` charts (`ChartTransform`,
  `ScatterPlot`). Switching to phase axis recomputes x-values via
  `AnalyzerModel.getPhase()`.
- **PDM plot**: another `bamboo` `LinePlot` drawing `pdmScanResultsProperty`.
  A draggable `Line` marks the current period. Click-drag on the chart sets
  `pdmZoomRangeProperty` (rubber-band selection).
- **Zoom buttons**: each button calls a method on `AnalyzerModel` that pushes/
  pops from `pdmZoomHistory` and updates `pdmZoomRangeProperty`.

---

## Phase 6 — Cross-screen state sharing

The 4 screens represent a workflow:  
Registration → Blink Comparator → Photometry → Analyzer

**Shared state to carry across screens:**

```typescript
// src/common/model/VSPSimulationContext.ts
export class VSPSimulationContext {
  // Registered epoch offsets (set in Registration, read in Blink/Photometry)
  public readonly registeredOffsets: Property<Map<number, Vector2>>;

  // Variable star candidate identified in Blink (used in Photometry/Analyzer)
  public readonly candidateStarIndexProperty: Property<number | null>;

  // Differential magnitude measurements (set in Photometry, read in Analyzer)
  public readonly measurements: ObservableArray<DiffMag>;
}
```

Pass `VSPSimulationContext` as a constructor argument to each Model.

---

## Phase 7 — Accessibility and polish

- **Keyboard help**: expand `VSPKeyboardHelpContent` with screen-specific
  sections (move working image arrows, blink play/pause Space, aperture
  nudge arrows, period increment/decrement).
- **Interactive highlights**: all draggable elements (apertures, star-field
  click targets, PDM drag window) need `InteractiveHighlightingNode` wrappers.
- **Alt text / PDOM**: each screen's `accessibleParagraph` should describe
  the current state (which star is selected, current period, etc.).
- **Projector mode**: `StarFieldNode.paintCanvas()` checks
  `VSPPreferencesModel.invertImagesProperty` and calls
  `CCDField.renderField(i, invert=true)`.
- **Responsive layout**: the 1024×768 SceneryStack layout should gracefully
  scale down for narrower viewports — use `ScreenView.layoutBounds` constants.

---

## Suggested implementation order

1. `StarFieldData.ts` + `LightCurveLibrary.ts` — no UI, unit-testable
2. `CCDField.ts` + `StarFieldNode.ts` — renders a field; verify visually
3. **Registration screen** — simplest interaction model; proves rendering pipeline
4. **Blink Comparator screen** — reuses rendering; adds queue state
5. **AperturePhotometry.ts** — pure math, unit-testable against Flash values
6. **Photometry screen** — draggable apertures + info readouts
7. **PDMCalculator.ts** — unit-test against known RR Leo / del Cep periods
8. **Analyzer screen** — most complex; depends on all prior work
9. **VSPSimulationContext** — thread shared state through all models
10. **Accessibility pass** — keyboard help, PDOM descriptions, highlights

---

## Known physics parameters

### Variable star periods and amplitudes

| Prototype | Period (days) | Amp (mag) | Type | Notes |
|---|---|---|---|---|
| `del_Cep` | 5.3663 | 0.84 | Classical Cepheid | Prototype star; well-characterized Fourier coefficients published |
| `RR_Leo` | 0.4521 | 0.85 | RR Lyrae ab | Fast-rise sawtooth; period well within 21-day dataset |
| `PZ_Aql` | 0.5717 | 0.42 | RR Lyrae c | Sinusoidal; shorter period, smaller amplitude |
| `MT_Tel` | 0.3170 | 0.55 | RR Lyrae ab | Short period; many cycles in dataset |
| `TW_Cas` | 1.3283 | 0.90 (primary) | Eclipsing binary | Flat max + trapezoidal eclipses; two minima per period |

### CCD magnitude–counts calibration

From `settings.xml`: `saturationMagnitude = 3.0`, meaning a star at magnitude 3
fills a pixel to 65535 ADU (16-bit full scale). Given PSF sum over disc:

```
totalCountsStar(m) = 65535 × 10^(−0.4 × (m − 3.0))
```

Distribute over pixels with a 2-D Gaussian of `σ = psfRadius / 2.355 ≈ 2.12 px`.

---

## File checklist (files to create)

```
src/common/model/
  StarFieldData.ts           ← encode settings.xml as typed constants
  LightCurveLibrary.ts       ← Δm(epoch) for each prototype
  CCDField.ts                ← render ImageData for an observation
  AperturePhotometry.ts      ← integrate aperture / annulus / Δmag
  PDMCalculator.ts           ← PDM theta scan
  VSPSimulationContext.ts    ← shared cross-screen state

src/common/view/
  StarFieldNode.ts           ← CanvasNode wrapping CCDField
  ApertureNode.ts            ← draggable aperture ring overlay
  LightCurvePlot.ts          ← bamboo scatter/line plot wrapper
  PdmPlotNode.ts             ← bamboo PDM plot + zoom interaction

src/registration/model/      (extend existing RegistrationModel)
src/registration/view/       (implement RegistrationScreenView)

src/blink-comparator/model/  (extend existing BlinkComparatorModel)
src/blink-comparator/view/   (implement BlinkComparatorScreenView)

src/photometry/model/        (extend existing PhotometryModel)
src/photometry/view/         (implement PhotometryScreenView)

src/analyzer/model/          (extend existing AnalyzerModel)
src/analyzer/view/           (implement AnalyzerScreenView)
```

Total new/extended files: ~20 source files + test files for the pure-math modules.
