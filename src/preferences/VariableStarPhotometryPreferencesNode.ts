import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import VariableStarPhotometryColors from "../VariableStarPhotometryColors.js";
import VariableStarPhotometryNamespace from "../VariableStarPhotometryNamespace.js";
import type { VariableStarPhotometryPreferencesModel } from "./VariableStarPhotometryPreferencesModel.js";

export class VariableStarPhotometryPreferencesNode extends VBox {
  public constructor(preferencesModel: VariableStarPhotometryPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: VariableStarPhotometryColors.textColorProperty,
    });

    const makeCheckbox = (
      property: VariableStarPhotometryPreferencesModel["showGridProperty"],
      labelProperty: typeof prefStrings.showGridStringProperty,
      tandemName: string,
    ): Checkbox =>
      new Checkbox(
        property,
        new Text(labelProperty, {
          font: new PhetFont(14),
          fill: VariableStarPhotometryColors.textColorProperty,
        }),
        {
          checkboxColor: VariableStarPhotometryColors.textColorProperty,
          checkboxColorBackground: VariableStarPhotometryColors.panelBackgroundColorProperty,
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

VariableStarPhotometryNamespace.register(
  "VariableStarPhotometryPreferencesNode",
  VariableStarPhotometryPreferencesNode,
);
