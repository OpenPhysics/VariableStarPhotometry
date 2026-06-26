import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen, ScreenSummaryContent } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../preferences/VSPPreferencesModel.js";
import VSPColors from "../VSPColors.js";
import { BlinkComparatorModel } from "./model/BlinkComparatorModel.js";
import { BlinkComparatorScreenView } from "./view/BlinkComparatorScreenView.js";

type BlinkComparatorScreenOptions = ScreenOptions & { tandem: Tandem; preferences: VSPPreferencesModel };

export class BlinkComparatorScreen extends Screen<BlinkComparatorModel, BlinkComparatorScreenView> {
  public constructor(options: BlinkComparatorScreenOptions) {
    const summaryStrings = StringManager.getInstance().getA11yStrings().screenSummary.blinkComparator;
    super(
      () => new BlinkComparatorModel(options.tandem.createTandem("model")),
      (model) =>
        new BlinkComparatorScreenView(model, options.preferences, {
          tandem: options.tandem.createTandem("view"),
          screenSummaryContent: new ScreenSummaryContent({
            playAreaContent: summaryStrings.playAreaStringProperty,
            controlAreaContent: summaryStrings.controlAreaStringProperty,
            interactionHintContent: summaryStrings.interactionHintStringProperty,
          }),
        }),
      optionize<BlinkComparatorScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent("blink"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
        },
        options,
      ),
    );
  }
}
