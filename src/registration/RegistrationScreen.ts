import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../preferences/VSPPreferencesModel.js";
import VSPColors from "../VSPColors.js";
import { RegistrationModel } from "./model/RegistrationModel.js";
import { RegistrationScreenSummaryContent } from "./view/RegistrationScreenSummaryContent.js";
import { RegistrationScreenView } from "./view/RegistrationScreenView.js";

type RegistrationScreenOptions = ScreenOptions & { tandem: Tandem; preferences: VSPPreferencesModel };

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
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent("registration"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
        },
        options,
      ),
    );
  }
}
