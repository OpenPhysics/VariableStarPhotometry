import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createAnalyzerIcon } from "../common/VariableStarPhotometryScreenIcons.js";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../preferences/VSPPreferencesModel.js";
import VSPColors from "../VSPColors.js";
import { AnalyzerModel } from "./model/AnalyzerModel.js";
import { AnalyzerScreenSummaryContent } from "./view/AnalyzerScreenSummaryContent.js";
import { AnalyzerScreenView } from "./view/AnalyzerScreenView.js";

type AnalyzerScreenOptions = ScreenOptions & { tandem: Tandem; preferences: VSPPreferencesModel };

export class AnalyzerScreen extends Screen<AnalyzerModel, AnalyzerScreenView> {
  public constructor(options: AnalyzerScreenOptions) {
    const summaryStrings = StringManager.getInstance().getAnalyzerA11yStrings().screenSummary;
    super(
      () => new AnalyzerModel(options.tandem.createTandem("model")),
      (model) =>
        new AnalyzerScreenView(model, options.preferences, {
          tandem: options.tandem.createTandem("view"),
          screenSummaryContent: new AnalyzerScreenSummaryContent(model),
        }),
      optionize<AnalyzerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent("analyzer"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
          homeScreenIcon: createAnalyzerIcon(),
          navigationBarIcon: createAnalyzerIcon(),
        },
        options,
      ),
    );
  }
}
