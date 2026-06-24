import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import VSPColors from "../VSPColors.js";
import VSPNamespace from "../VSPNamespace.js";
import type { VSPPreferencesModel } from "./VSPPreferencesModel.js";

export class VSPPreferencesNode extends VBox {
  public constructor(preferencesModel: VSPPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: VSPColors.textColorProperty,
    });

    const makeCheckbox = (
      property: VSPPreferencesModel["showGridProperty"],
      labelProperty: typeof prefStrings.showGridStringProperty,
      tandemName: string,
    ): Checkbox =>
      new Checkbox(
        property,
        new Text(labelProperty, {
          font: new PhetFont(14),
          fill: VSPColors.textColorProperty,
        }),
        {
          checkboxColor: VSPColors.textColorProperty,
          checkboxColorBackground: VSPColors.panelBackgroundColorProperty,
          spacing: 8,
          ...(tandem && { tandem: tandem.createTandem(tandemName) }),
        },
      );

    super({
      align: "left",
      spacing: 12,
      children: [
        header,
        makeCheckbox(preferencesModel.showGridProperty, prefStrings.showGridStringProperty, "showGridCheckbox"),
        makeCheckbox(
          preferencesModel.invertImagesProperty,
          prefStrings.invertImagesStringProperty,
          "invertImagesCheckbox",
        ),
      ],
    });
  }
}

VSPNamespace.register("VSPPreferencesNode", VSPPreferencesNode);
