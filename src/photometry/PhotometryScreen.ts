import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createPhotometryIcon } from "../common/VariableStarPhotometryScreenIcons.js";
import { VSPKeyboardHelpContent } from "../common/view/VSPKeyboardHelpContent.js";
import { StringManager } from "../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../preferences/VSPPreferencesModel.js";
import VSPColors from "../VSPColors.js";
import { PhotometryModel } from "./model/PhotometryModel.js";
import { PhotometryScreenSummaryContent } from "./view/PhotometryScreenSummaryContent.js";
import { PhotometryScreenView } from "./view/PhotometryScreenView.js";

type PhotometryScreenOptions = ScreenOptions & { tandem: Tandem; preferences: VSPPreferencesModel };

export class PhotometryScreen extends Screen<PhotometryModel, PhotometryScreenView> {
  public constructor(options: PhotometryScreenOptions) {
    const summaryStrings = StringManager.getInstance().getPhotometryA11yStrings().screenSummary;
    super(
      () => new PhotometryModel(options.tandem.createTandem("model")),
      (model) =>
        new PhotometryScreenView(model, options.preferences, {
          tandem: options.tandem.createTandem("view"),
          screenSummaryContent: new PhotometryScreenSummaryContent(model),
        }),
      optionize<PhotometryScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VSPColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VSPKeyboardHelpContent("photometry"),
          screenButtonsHelpText: summaryStrings.interactionHintStringProperty,
          homeScreenIcon: createPhotometryIcon(),
          navigationBarIcon: createPhotometryIcon(),
        },
        options,
      ),
    );
  }
}
