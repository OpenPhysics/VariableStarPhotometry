# Model — Variable Star Photometry

## Overview

The simulation models a CCD aperture photometry workflow for determining the period of a pulsating
variable star (based on δ Cephei). Students work through four screens — Registration, Blink
Comparator, Photometry, and Analyzer — to produce a phase-folded light curve and confirm the period
using Phase Dispersion Minimization.

## Synthetic CCD Star Field

### Data source

`src/common/model/StarFieldData.ts` stores a catalogue of stars with:
- CCD pixel position (x, y) within the 380 × 290 px field
- Apparent magnitude and pulsation amplitude (for the target variable)
- 21 observation epochs, each recording a Julian date offset from the reference epoch (JD 1.7215 d)

### Rendering (`CCDField`)

`CCDField` (singleton) converts the catalogue to pixel-level `ImageData` on demand. For each star
at a given epoch:

1. Compute the star's instantaneous magnitude (variable stars oscillate with epoch).
2. Convert magnitude to peak ADU using the calibration curve; clamp at the saturation limit.
3. Apply a Gaussian point-spread function (PSF) of radius 5 px around the star centre.
4. Add per-pixel sky background: Gaussian noise with mean 2300 ADU and σ 330 ADU.

Rendered `ImageData` is cached per epoch. All four screens share the same cache.

## Aperture Photometry (Photometry screen)

### Aperture model

Two independent apertures can be placed on any stars. Each aperture has three configurable radii:
- **Aperture disc radius** = `apertureDiameter / 2`: pixels within this circle contribute to the star signal.
- **Annulus inner radius**: inner boundary of the sky background ring.
- **Annulus outer radius**: outer boundary of the sky background ring.

All three are shared between the two apertures (same instrument settings per epoch).

### Signal computation

For an aperture centred at pixel (cx, cy):

```
disc_pixels   = { (x,y) | dist(x,y,cx,cy) ≤ r_aperture }
sky_pixels    = { (x,y) | r_inner < dist(x,y,cx,cy) ≤ r_outer }

disc_counts   = Σ pixel(x,y)  for (x,y) in disc_pixels
sky_mean      = Σ pixel(x,y) / |sky_pixels|  for (x,y) in sky_pixels
net_flux      = disc_counts − sky_mean × |disc_pixels|
```

The result is a `DerivedProperty` that updates whenever the aperture centre, radii, or epoch changes.

### Magnitude difference

```
Δm = m₁ − m₂ = −2.5 log₁₀(f₁ / f₂)
```

`magnitudeDifferenceProperty` is `null` when either net flux is ≤ 0 (saturated aperture, poorly
placed aperture, or empty annulus).

## Blink Comparator

`BlinkComparatorModel` maintains:
- `selectedObsIndexProperty` — the observation highlighted in the epoch table
- `blinkQueue: ObservableArray<number>` — ordered list of observation indices to blink through
- `queuePositionProperty` — current position in the queue
- `isBlinkingProperty` — whether the blink timer is running
- `blinkIntervalMsProperty` — milliseconds between frames (range: 200 – 2000 ms)

When blinking, `step(dt)` accumulates elapsed time and advances `queuePositionProperty` (wrapping)
once the interval is reached, which updates `displayedObsIndexProperty` and the star field canvas.

## Analyzer

### Measurements

The student clicks the star field to designate a variable star and a comparison star
(`variableStarPositionProperty`, `comparisonStarPositionProperty`). Once both are set, the model
computes Δm for every epoch using the nearest-pixel ADU values from the CCD cache (not the full
aperture integral). This produces `measurementsProperty`: an array of `{ epoch, magnitude }` records.

### Light curve modes

`lightCurveModeProperty` switches between:
- **`"time"`**: x-axis is Julian epoch (days); vertical markers show multiples of the trial period.
- **`"phase"`**: x-axis is orbital phase φ ∈ [0, 1), computed as:
  ```
  φ = ((epoch − phaseOffset) mod trialPeriod) / trialPeriod
  ```

### Phase Dispersion Minimization

`PDMCalculator.ts` implements the standard PDM algorithm (Stellingwerf 1978):

1. Scan a range of trial periods T (currently 0.5 – 20 d at fixed step).
2. For each T:
   a. Phase-fold all measurements: φᵢ = ((epochᵢ − offset) mod T) / T
   b. Bin the phased measurements into M equal bins (M = 5 by default).
   c. Compute the within-bin variance σ²_bins (weighted mean of per-bin variances).
   d. Compute the overall variance σ²_total of all magnitudes.
   e. θ(T) = σ²_bins / σ²_total
3. The global minimum θ indicates the best-fit period.

`pdmScanResultsProperty` stores `{ period, theta }` pairs. `pdmZoomRangeProperty` tracks the
current x-axis range; an undo history stack records previous zoom ranges.

## Registration

`RegistrationModel` holds:
- Fixed reference field: `obsIndex1` (observation index, read-only)
- Two movable fields: `obsIndex2`, `obsIndex3`
- XY pixel offsets: `xOffset2Property`, `yOffset2Property`, `xOffset3Property`, `yOffset3Property`
- Visibility: `shown2Property`, `shown3Property`
- `onTopIndexProperty` (2 or 3): which movable field receives keyboard/drag input
- `topFieldTransparentProperty`: whether the on-top field is rendered at 40% opacity
- `invertColorsProperty`: whether all three fields are displayed with inverted luminance

Offsets are constrained to `[−FIELD_WIDTH, FIELD_WIDTH] × [−FIELD_HEIGHT, FIELD_HEIGHT]`. The
`nudgeOnTopField(dx, dy)` method increments the active field's offset by 1 px per arrow key press.
