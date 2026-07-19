# Multi-Screen Simulations

Variable Star Photometry is a **four-screen** astronomy lab. Screens are
independent (separate models) but share `VariableStarPhotometryPreferencesModel`.
Icons and keyboard-help defaults are wired in each `*Screen.ts`.

For pedagogy and architecture, see [model.md](./model.md) and
[implementation-notes.md](./implementation-notes.md).

---

## Screens in this sim

| Order | UI name | Folder | Screen class | Icon factory |
|---|---|---|---|---|
| 1 | Registration | `src/registration/` | `RegistrationScreen` | `createRegistrationIcon()` |
| 2 | Blink Comparator | `src/blink-comparator/` | `BlinkComparatorScreen` | `createBlinkComparatorIcon()` |
| 3 | Photometry | `src/photometry/` | `PhotometryScreen` | `createPhotometryIcon()` |
| 4 | Analyzer | `src/analyzer/` | `AnalyzerScreen` | `createAnalyzerIcon()` |

```
main.ts
  ├─ RegistrationScreen      → RegistrationModel / RegistrationScreenView
  ├─ BlinkComparatorScreen   → BlinkComparatorModel / BlinkComparatorScreenView
  ├─ PhotometryScreen        → PhotometryModel / PhotometryScreenView
  └─ AnalyzerScreen          → AnalyzerModel / AnalyzerScreenView
```

Each screen constructs its own model in the Screen factory. Shared state is
limited to Preferences (and any common helpers under `src/common/`).

---

## Folder layout

```
src/
├─ common/
│   ├─ VariableStarPhotometryScreenIcons.ts
│   ├─ model/
│   └─ view/   # shared keyboard help, etc.
├─ registration/
│   ├─ RegistrationScreen.ts
│   ├─ model/RegistrationModel.ts
│   └─ view/
├─ blink-comparator/
│   ├─ BlinkComparatorScreen.ts
│   ├─ model/
│   └─ view/
├─ photometry/
│   ├─ PhotometryScreen.ts
│   ├─ model/
│   └─ view/
└─ analyzer/
    ├─ AnalyzerScreen.ts
    ├─ model/
    └─ view/
```

Do **not** add per-screen `*ScreenIcon.ts` files — use
`src/common/VariableStarPhotometryScreenIcons.ts` only.

---

## Wiring in `main.ts` and `*Screen.ts`

`main.ts` creates preferences once, then registers screens with localized
`name` and `tandem`. Icons are **not** passed from `main.ts`; each Screen sets
them in `optionize` defaults:

```typescript
// src/main.ts
const preferences = new VariableStarPhotometryPreferencesModel(
  Tandem.ROOT.createTandem("preferences"),
);

const screens = [
  new RegistrationScreen({
    preferences,
    name: screenNames.registrationStringProperty,
    tandem: Tandem.ROOT.createTandem("registrationScreen"),
  }),
  new BlinkComparatorScreen({ /* … */ }),
  new PhotometryScreen({ /* … */ }),
  new AnalyzerScreen({ /* … */ }),
];
```

```typescript
// e.g. src/registration/RegistrationScreen.ts
import { createRegistrationIcon } from "../common/VariableStarPhotometryScreenIcons.js";

optionize<RegistrationScreenOptions, EmptySelfOptions, ScreenOptions>()(
  {
    backgroundColorProperty: VariableStarPhotometryColors.backgroundColorProperty,
    createKeyboardHelpNode: () =>
      new VariableStarPhotometryKeyboardHelpContent("registration"),
    homeScreenIcon: createRegistrationIcon(),
    navigationBarIcon: createRegistrationIcon(),
  },
  options,
);
```

---

## Home screen icons

### Fleet convention

```
src/common/VariableStarPhotometryScreenIcons.ts
```

| Screen | Factory |
|---|---|
| Registration | `createRegistrationIcon()` |
| Blink Comparator | `createBlinkComparatorIcon()` |
| Photometry | `createPhotometryIcon()` |
| Analyzer | `createAnalyzerIcon()` |

Draw on the PhET **548 × 373** canvas with scenery primitives and
`VariableStarPhotometryColors` so icons track default / projector mode.

---

## Screen options reference

| Option | Type | Purpose |
|---|---|---|
| `name` | `ReadOnlyProperty<string>` | Localizable tab label |
| `tandem` | `Tandem` | PhET-iO registration root |
| `backgroundColorProperty` | `TReadOnlyProperty<Color>` | Screen background |
| `createKeyboardHelpNode` | `() => Node` | Per-screen keyboard help |
| `homeScreenIcon` | `ScreenIcon` | Icon on the home screen |
| `navigationBarIcon` | `ScreenIcon` | Smaller icon in the nav bar |
| `preferences` | `VariableStarPhotometryPreferencesModel` | Shared Preferences |

---

## Strings and accessibility

Titles: `screens.registration`, `blinkComparator`, `photometry`, `analyzer` in
`strings_*.json`, via `StringManager.getScreenNames()`.

Each screen has its own summary / a11y helpers (e.g.
`getRegistrationA11yStrings()`). Keyboard help is parameterized by screen id in
`VariableStarPhotometryKeyboardHelpContent`.

---

## Adding another screen

1. Add a `screens` key in every locale file; expose it from `getScreenNames()`.
2. Add `src/<name>/` with Screen, model, and view.
3. Add `create…Icon()` to `VariableStarPhotometryScreenIcons.ts` and wire both
   icons in the new `*Screen.ts`.
4. Register the screen in `main.ts` with `preferences`, `name`, and `tandem`.
