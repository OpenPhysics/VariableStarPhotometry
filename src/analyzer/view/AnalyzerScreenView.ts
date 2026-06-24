/**
 * AnalyzerScreenView.ts
 *
 * View for the Analyzer screen.
 *
 * Layout (TODO: implement)
 * ┌──────────────────────────────────────────────────────┐
 * │  Light-curve plot (JD vs magnitude)                  │
 * │  ─────────────────────────────────────────────────── │
 * │  [Phase-fold toggle]  [Period control]  [Phase offset] │
 * │  [Reset]                                             │
 * └──────────────────────────────────────────────────────┘
 */
import { Node } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import type { AnalyzerModel } from "../model/AnalyzerModel.js";

export class AnalyzerScreenView extends ScreenView {
  public constructor(model: AnalyzerModel, options?: ScreenViewOptions) {
    super(options);

    // TODO: add ChartTransform-based scatter plot, period NumberControl,
    //       phase-offset control, phase-fold toggle checkbox, export button.

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
