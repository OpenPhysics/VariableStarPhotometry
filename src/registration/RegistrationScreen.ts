import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen, ScreenSummaryContent } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../preferences/VSPPreferencesModel.js";
import VSPColors from "../VSPColors.js";
import { RegistrationModel } from "./model/RegistrationModel.js";
import { RegistrationScreenView } from "./view/RegistrationScreenView.js";

type RegistrationScreenOptions = ScreenOptions & { tandem: Tandem; preferences: VSPPreferencesModel };

export class RegistrationScreen extends Screen<RegistrationModel, RegistrationScreenView> {
  public constructor(options: RegistrationScreenOptions) {
    const summaryStrings = StringManager.getInstance().getA11yStrings().screenSummary.registration;
    super(
      () => new RegistrationModel(options.preferences, options.tandem.createTandem("model")),
      (model) =>
        new RegistrationScreenView(model, {
          tandem: options.tandem.createTandem("view"),
          screenSummaryContent: new ScreenSummaryContent({
            playAreaContent: summaryStrings.playAreaStringProperty,
            controlAreaContent: summaryStrings.controlAreaStringProperty,
            interactionHintContent: summaryStrings.interactionHintStringProperty,
          }),
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
