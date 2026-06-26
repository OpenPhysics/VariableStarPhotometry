import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen, ScreenSummaryContent } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../preferences/VSPPreferencesModel.js";
import VSPColors from "../VSPColors.js";
import { AnalyzerModel } from "./model/AnalyzerModel.js";
import { AnalyzerScreenView } from "./view/AnalyzerScreenView.js";

type AnalyzerScreenOptions = ScreenOptions & { tandem: Tandem; preferences: VSPPreferencesModel };

export class AnalyzerScreen extends Screen<AnalyzerModel, AnalyzerScreenView> {
  public constructor(options: AnalyzerScreenOptions) {
    const summaryStrings = StringManager.getInstance().getA11yStrings().screenSummary.analyzer;
    super(
      () => new AnalyzerModel(options.tandem.createTandem("model")),
      (model) =>
        new AnalyzerScreenView(model, options.preferences, {
          tandem: options.tandem.createTandem("view"),
          screenSummaryContent: new ScreenSummaryContent({
            playAreaContent: summaryStrings.playAreaStringProperty,
            controlAreaContent: summaryStrings.controlAreaStringProperty,
            interactionHintContent: summaryStrings.interactionHintStringProperty,
          }),
        }),
      optionize<AnalyzerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent("analyzer"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
        },
        options,
      ),
    );
  }
}
