/**
 * PhotometryScreenView.ts
 *
 * View for the Photometry screen.
 *
 * Layout (TODO: implement)
 * ┌──────────────────────────────────────────────────────────────┐
 * │  CCD image with aperture overlays  │  Measurement table      │
 * │  ──────────────────────────────────────────────────────────  │
 * │  [Aperture slider]  [Annulus sliders]  [Epoch selector]  [Reset] │
 * └──────────────────────────────────────────────────────────────┘
 */
import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import type { PhotometryModel } from "../model/PhotometryModel.js";

export class PhotometryScreenView extends ScreenView {
  public constructor(model: PhotometryModel, options?: ScreenViewOptions) {
    super(options);

    // TODO: add CCD canvas with draggable aperture rings, sky-annulus rings,
    //       measurement table, aperture/annulus size sliders.

    const placeholder = new Node();
    this.addChild(placeholder);

    const resetAllButton = new ResetAllButton({
      listener: () => model.reset(),
      right: this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10,
      tandem: options?.tandem instanceof Tandem ? options.tandem.createTandem("resetAllButton") : Tandem.OPT_OUT,
    });

    this.addChild(resetAllButton);
  }

  public override step(dt: number): void {
    super.step(dt);
  }
}
