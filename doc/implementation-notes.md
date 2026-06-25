# Implementation Notes — Variable Star Photometry

## Architecture

The sim follows the standard OpenPhysics multi-screen structure:

```
src/
  main.ts                       — entry point; Sim + four Screen instances
  VSPColors.ts                  — ProfileColorProperty instances (default + projector)
  VSPConstants.ts               — frozen grouped constants (FIELD, APERTURE, TIME, LAYOUT, FONT_SIZE)
  VSPNamespace.ts               — Namespace for register()
  common/
    model/
      CCDField.ts               — singleton; pixel rendering + per-epoch ImageData cache
      StarFieldData.ts          — star catalogue + 21 epoch records
      PDMCalculator.ts          — pure PDM computation (no axon dependencies)
    view/
      ApertureNode.ts           — draggable aperture + sky-annulus overlay
      StarFieldNode.ts          — CanvasNode for a single observation epoch
  {screen}/
    model/{Screen}Model.ts
    view/{Screen}ScreenView.ts
  i18n/
    StringManager.ts            — singleton; typed per-screen string getters
    strings_en.json
    strings_es.json
    strings_fr.json
  preferences/
    vspQueryParameters.ts       — QueryStringMachine parameters
```

## Key Design Decisions

### Coordinate system — no ModelViewTransform2

Model and view share CCD pixel coordinates (origin top-left, x right, y down, 380 × 290 px).
This mirrors the raw sensor readout convention and matches the NAAP Flash original. A
`ModelViewTransform2` would be an identity transform and is intentionally absent to avoid
unnecessary indirection.

When a screen needs a different display size (e.g., Blink Comparator uses `FIELD_SCALE = 1.25`),
the star field `Node` is scaled in the scene graph. Model coordinates are unaffected — the view
converts via `node.globalToLocalPoint()` for any hit detection that needs model coordinates.

### CCDField singleton + ImageData caching

`CCDField` renders each of the 21 epochs once and caches the `ImageData`. Because pixel rendering
involves a per-pixel PSF convolution (O(N_stars × PSF_area) per epoch), lazy caching on first
access keeps startup cost low while ensuring subsequent repaints are instant. All screens share
the same singleton and cache.

### VSPConstants grouped structure

Rather than a flat constant object, `VSPConstants` groups constants by domain. The grouped
structure is a documented deviation from the flat TemplateSingleSim pattern (see CLAUDE.md).
The file lives at `src/VSPConstants.ts` as required by CONVENTIONS.md.

### Axon property discipline

All mutable state is held in axon `Property` subclasses or `ObservableArray`. Derived quantities
(aperture photometry results, magnitude difference, PDM scan, phase data) are `DerivedProperty`
instances. Views subscribe via `.link()` or `Multilink.multilink()` — no manual refresh calls
anywhere.

### ApertureNode dragging

`ApertureNode` uses SceneryStack `DragListener` with a `dragBounds` constraint. The aperture
centre is stored in a `Vector2Property`; the view renders three concentric circles (disc, inner
annulus, outer annulus) as SVG-like `Circle` nodes whose radii are bound to
`DerivedProperty<number>` values derived from the model's slider properties.

### Blink timer in `step(dt)`

Blinking is implemented via accumulated time in `BlinkComparatorModel.step(dt)` rather than a
browser `setInterval`. This keeps time advances frame-rate-aware and consistent with the
SceneryStack animation loop.

### PDM scan is synchronous

The PDM scan runs synchronously on the main thread when measurements change. With 21 data points
and ~400 trial periods the computation is sub-millisecond. If the dataset grows, the scan should
be moved to a Web Worker.

### Query parameters

`src/preferences/vspQueryParameters.ts` registers parameters via `QueryStringMachine`. The
filename follows the lowercase-first camelCase convention. Parameters are read once at startup
before `main.ts` runs.

## Localization

Three locales: `en`, `es`, `fr`. Each JSON file mirrors the same key tree. `StringManager` falls
back to English for any missing key. Screen names are registered in `init.ts` and displayed in
the tab bar. A11y strings live under the `a11y` key and are returned by `getA11yStrings()`.

## PWA

`vite-plugin-pwa` generates a Workbox service worker and `dist/manifest.webmanifest` at build
time. The sim is installable and offline-capable after `npm run build && npm run preview`.

## CI

Shared GitHub Actions workflows are inherited from `OpenPhysics/Baton` (TypeScript check, Biome
lint, Vite build). No sim-specific CI overrides are needed.
