import type { ReadOnlyProperty } from "scenerystack/axon";
import { LocalizedString } from "scenerystack/chipper";
import stringsEn from "./strings_en.json";
import stringsEs from "./strings_es.json";
import stringsFr from "./strings_fr.json";

// Compile-time key-parity checks
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsEs);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEs satisfies typeof stringsEn);

const stringProperties = LocalizedString.getNestedStringProperties({
  en: stringsEn,
  fr: stringsFr,
  es: stringsEs,
});

export class StringManager {
  private static instance: StringManager | null = null;

  private constructor() {} // obtain via getInstance()

  public static getInstance(): StringManager {
    StringManager.instance ??= new StringManager();
    return StringManager.instance;
  }

  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return stringProperties.titleStringProperty;
  }

  public getScreenNames(): {
    readonly registrationStringProperty: ReadOnlyProperty<string>;
    readonly blinkComparatorStringProperty: ReadOnlyProperty<string>;
    readonly photometryStringProperty: ReadOnlyProperty<string>;
    readonly analyzerStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      registrationStringProperty: stringProperties.screens.registrationStringProperty,
      blinkComparatorStringProperty: stringProperties.screens.blinkComparatorStringProperty,
      photometryStringProperty: stringProperties.screens.photometryStringProperty,
      analyzerStringProperty: stringProperties.screens.analyzerStringProperty,
    };
  }

  public getControlStrings(): typeof stringProperties.controls {
    return stringProperties.controls;
  }

  public getLabelStrings(): typeof stringProperties.labels {
    return stringProperties.labels;
  }

  public getStarTypeStrings(): typeof stringProperties.starTypes {
    return stringProperties.starTypes;
  }

  public getUnitStrings(): typeof stringProperties.units {
    return stringProperties.units;
  }

  public getMessageStrings(): typeof stringProperties.messages {
    return stringProperties.messages;
  }

  public getA11yStrings(): typeof stringProperties.a11y {
    return stringProperties.a11y;
  }

  public getRegistrationA11yStrings(): typeof stringProperties.a11y.registration {
    return stringProperties.a11y.registration;
  }

  public getBlinkComparatorA11yStrings(): typeof stringProperties.a11y.blinkComparator {
    return stringProperties.a11y.blinkComparator;
  }

  public getPhotometryA11yStrings(): typeof stringProperties.a11y.photometry {
    return stringProperties.a11y.photometry;
  }

  public getAnalyzerA11yStrings(): typeof stringProperties.a11y.analyzer {
    return stringProperties.a11y.analyzer;
  }

  public getPreferences(): typeof stringProperties.preferences {
    return stringProperties.preferences;
  }

  public getRegistrationViewStrings(): typeof stringProperties.view.registration {
    return stringProperties.view.registration;
  }

  public getBlinkViewStrings(): typeof stringProperties.view.blink {
    return stringProperties.view.blink;
  }

  public getPhotometryViewStrings(): typeof stringProperties.view.photometry {
    return stringProperties.view.photometry;
  }

  public getAnalyzerViewStrings(): typeof stringProperties.view.analyzer {
    return stringProperties.view.analyzer;
  }
}
