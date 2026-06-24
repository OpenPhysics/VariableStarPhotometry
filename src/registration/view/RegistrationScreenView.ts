/**
 * RegistrationScreenView.ts
 *
 * View for the Registration screen.
 *
 * Layout (TODO: implement)
 * ┌─────────────────────────────────────────────────────┐
 * │  Reference image (left)  │  Working image (right)  │
 * │  ─────────────────────────────────────────────────  │
 * │  [Shift controls]  [Epoch selector]  [Reset]        │
 * └─────────────────────────────────────────────────────┘
 */
import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import type { RegistrationModel } from "../model/RegistrationModel.js";

export class RegistrationScreenView extends ScreenView {
  public constructor(model: RegistrationModel, options?: ScreenViewOptions) {
    super(options);

    // TODO: add star-field canvas nodes, drag listener for image alignment,
    //       epoch selector combo box, grid overlay toggle, offset readouts.

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
