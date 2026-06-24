/**
 * BlinkComparatorModel.ts
 *
 * Model for the Blink Comparator screen.
 *
 * Two registered CCD images are alternately displayed (blinked) at a
 * configurable rate. Students visually identify stars whose brightness
 * changes between frames — these are variable-star candidates.
 *
 * TODO: consume registered image data from RegistrationModel; implement
 *       blink timer, candidate-star tagging, and epoch-pair selection.
 */
import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import VSPConstants from "../../common/VSPConstants.js";
import VSPNamespace from "../../VSPNamespace.js";

/** Allowed range for blink interval in milliseconds. */
export const BLINK_INTERVAL_RANGE = new Range(200, 2000);

export class BlinkComparatorModel {
  /** Currently displayed frame: 0 = reference, 1 = comparison. */
  public readonly currentFrameProperty: NumberProperty;

  /** Blink interval in milliseconds. */
  public readonly blinkIntervalMsProperty: NumberProperty;

  /** Whether automatic blinking is active. */
  public readonly isBlinkingProperty: BooleanProperty;

  /** Accumulated time since last frame flip, in seconds. */
  private blinkAccumulatorS = 0;

  public constructor(_tandem?: Tandem) {
    this.currentFrameProperty = new NumberProperty(0, { numberType: "Integer" });

    this.blinkIntervalMsProperty = new NumberProperty(VSPConstants.DEFAULT_BLINK_INTERVAL_MS, {
      range: BLINK_INTERVAL_RANGE,
    });

    this.isBlinkingProperty = new BooleanProperty(true);
  }

  public step(dt: number): void {
    if (!this.isBlinkingProperty.value) {
      return;
    }
    this.blinkAccumulatorS += dt;
    const intervalS = this.blinkIntervalMsProperty.value / 1000;
    if (this.blinkAccumulatorS >= intervalS) {
      this.blinkAccumulatorS -= intervalS;
      // Toggle between frame 0 and frame 1
      this.currentFrameProperty.value = this.currentFrameProperty.value === 0 ? 1 : 0;
    }
  }

  public reset(): void {
    this.currentFrameProperty.reset();
    this.blinkIntervalMsProperty.reset();
    this.isBlinkingProperty.reset();
    this.blinkAccumulatorS = 0;
  }
}

VSPNamespace.register("BlinkComparatorModel", BlinkComparatorModel);
