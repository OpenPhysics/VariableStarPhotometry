import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import VSPNamespace from "../VSPNamespace.js";
import vspQueryParameters from "./vspQueryParameters.js";

export class VSPPreferencesModel {
  public readonly showGridProperty: BooleanProperty;
  public readonly invertImagesProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showGridProperty = new BooleanProperty(
      vspQueryParameters.showGrid,
      tandem ? { tandem: tandem.createTandem("showGridProperty") } : undefined,
    );

    this.invertImagesProperty = new BooleanProperty(
      vspQueryParameters.invertImages,
      tandem ? { tandem: tandem.createTandem("invertImagesProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showGridProperty.reset();
    this.invertImagesProperty.reset();
  }
}

VSPNamespace.register("VSPPreferencesModel", VSPPreferencesModel);
