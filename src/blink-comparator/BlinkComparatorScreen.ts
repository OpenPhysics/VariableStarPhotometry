import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createBlinkComparatorIcon } from "../common/VariableStarPhotometryScreenIcons.js";
import { VariableStarPhotometryKeyboardHelpContent } from "../common/view/VariableStarPhotometryKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VariableStarPhotometryPreferencesModel } from "../preferences/VariableStarPhotometryPreferencesModel.js";
import VariableStarPhotometryColors from "../VariableStarPhotometryColors.js";
import { BlinkComparatorModel } from "./model/BlinkComparatorModel.js";
import { BlinkComparatorScreenSummaryContent } from "./view/BlinkComparatorScreenSummaryContent.js";
import { BlinkComparatorScreenView } from "./view/BlinkComparatorScreenView.js";

type BlinkComparatorScreenOptions = ScreenOptions & {
  tandem: Tandem;
  preferences: VariableStarPhotometryPreferencesModel;
};

export class BlinkComparatorScreen extends Screen<BlinkComparatorModel, BlinkComparatorScreenView> {
  public constructor(options: BlinkComparatorScreenOptions) {
    const summaryStrings = StringManager.getInstance().getBlinkComparatorA11yStrings().screenSummary;
    super(
      () => new BlinkComparatorModel(options.tandem.createTandem("model")),
      (model) =>
        new BlinkComparatorScreenView(model, options.preferences, {
          tandem: options.tandem.createTandem("view"),
          screenSummaryContent: new BlinkComparatorScreenSummaryContent(model),
        }),
      optionize<BlinkComparatorScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VariableStarPhotometryColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VariableStarPhotometryKeyboardHelpContent("blink"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
          homeScreenIcon: createBlinkComparatorIcon(),
          navigationBarIcon: createBlinkComparatorIcon(),
        },
        options,
      ),
    );
  }
}
