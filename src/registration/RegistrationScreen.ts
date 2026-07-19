import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createRegistrationIcon } from "../common/VariableStarPhotometryScreenIcons.js";
import { VariableStarPhotometryKeyboardHelpContent } from "../common/view/VariableStarPhotometryKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VariableStarPhotometryPreferencesModel } from "../preferences/VariableStarPhotometryPreferencesModel.js";
import VariableStarPhotometryColors from "../VariableStarPhotometryColors.js";
import { RegistrationModel } from "./model/RegistrationModel.js";
import { RegistrationScreenSummaryContent } from "./view/RegistrationScreenSummaryContent.js";
import { RegistrationScreenView } from "./view/RegistrationScreenView.js";

type RegistrationScreenOptions = ScreenOptions & {
  tandem: Tandem;
  preferences: VariableStarPhotometryPreferencesModel;
};

export class RegistrationScreen extends Screen<RegistrationModel, RegistrationScreenView> {
  public constructor(options: RegistrationScreenOptions) {
    const summaryStrings = StringManager.getInstance().getRegistrationA11yStrings().screenSummary;
    super(
      () => new RegistrationModel(options.preferences, options.tandem.createTandem("model")),
      (model) =>
        new RegistrationScreenView(model, {
          tandem: options.tandem.createTandem("view"),
          screenSummaryContent: new RegistrationScreenSummaryContent(model),
        }),
      optionize<RegistrationScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VariableStarPhotometryColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VariableStarPhotometryKeyboardHelpContent("registration"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
          homeScreenIcon: createRegistrationIcon(),
          navigationBarIcon: createRegistrationIcon(),
        },
        options,
      ),
    );
  }
}
