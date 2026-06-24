import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import VSPColors from "../VSPColors.js";
import { BlinkComparatorModel } from "./model/BlinkComparatorModel.js";
import { BlinkComparatorScreenView } from "./view/BlinkComparatorScreenView.js";

type BlinkComparatorScreenOptions = ScreenOptions & { tandem: Tandem };

export class BlinkComparatorScreen extends Screen<BlinkComparatorModel, BlinkComparatorScreenView> {
  public constructor(options: BlinkComparatorScreenOptions) {
    super(
      () => new BlinkComparatorModel(options.tandem.createTandem("model")),
      (model) =>
        new BlinkComparatorScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<BlinkComparatorScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
