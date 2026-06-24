/**
 * BlinkComparatorScreenView.ts
 *
 * View for the Blink Comparator screen.
 *
 * Layout (TODO: implement)
 * ┌────────────────────────────────────────────────────┐
 * │  Blinking CCD frame (fills most of the screen)     │
 * │  ─────────────────────────────────────────────     │
 * │  [Play/Pause]  [Blink speed slider]  [Reset]        │
 * └────────────────────────────────────────────────────┘
 */
import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import type { BlinkComparatorModel } from "../model/BlinkComparatorModel.js";

export class BlinkComparatorScreenView extends ScreenView {
  private readonly model: BlinkComparatorModel;

  public constructor(model: BlinkComparatorModel, options?: ScreenViewOptions) {
    super(options);

    this.model = model;

    // TODO: add CCD image canvas node that switches on model.currentFrameProperty,
    //       play/pause button, blink-speed slider, epoch-pair selector.

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
    this.model.step(dt);
  }
}
