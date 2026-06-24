import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import VSPColors from "../VSPColors.js";
import { PhotometryModel } from "./model/PhotometryModel.js";
import { PhotometryScreenView } from "./view/PhotometryScreenView.js";

type PhotometryScreenOptions = ScreenOptions & { tandem: Tandem };

export class PhotometryScreen extends Screen<PhotometryModel, PhotometryScreenView> {
  public constructor(options: PhotometryScreenOptions) {
    super(
      () => new PhotometryModel(options.tandem.createTandem("model")),
      (model) =>
        new PhotometryScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<PhotometryScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent(),
        },
        options,
      ),
    );
  }
}
