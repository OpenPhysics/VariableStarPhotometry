import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createAnalyzerIcon } from "../common/VariableStarPhotometryScreenIcons.js";
import { VariableStarPhotometryKeyboardHelpContent } from "../common/view/VariableStarPhotometryKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VariableStarPhotometryPreferencesModel } from "../preferences/VariableStarPhotometryPreferencesModel.js";
import VariableStarPhotometryColors from "../VariableStarPhotometryColors.js";
import { AnalyzerModel } from "./model/AnalyzerModel.js";
import { AnalyzerScreenSummaryContent } from "./view/AnalyzerScreenSummaryContent.js";
import { AnalyzerScreenView } from "./view/AnalyzerScreenView.js";

type AnalyzerScreenOptions = ScreenOptions & { tandem: Tandem; preferences: VariableStarPhotometryPreferencesModel };

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
          backgroundColorProperty: VariableStarPhotometryColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VariableStarPhotometryKeyboardHelpContent("analyzer"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
          homeScreenIcon: createAnalyzerIcon(),
          navigationBarIcon: createAnalyzerIcon(),
        },
        options,
      ),
    );
  }
}
