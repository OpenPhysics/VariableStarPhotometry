import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import VSPColors from "../VSPColors.js";
import { AnalyzerModel } from "./model/AnalyzerModel.js";
import { AnalyzerScreenView } from "./view/AnalyzerScreenView.js";

type AnalyzerScreenOptions = ScreenOptions & { tandem: Tandem };

export class AnalyzerScreen extends Screen<AnalyzerModel, AnalyzerScreenView> {
  public constructor(options: AnalyzerScreenOptions) {
    super(
      () => new AnalyzerModel(options.tandem.createTandem("model")),
      (model) =>
        new AnalyzerScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<AnalyzerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
