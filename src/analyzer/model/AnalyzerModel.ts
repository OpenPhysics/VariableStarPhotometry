/**
 * AnalyzerModel.ts
 *
 * Model for the Analyzer screen.
 *
 * Instrumental-magnitude measurements from the Photometry screen are plotted
 * against Julian Date to produce a raw light curve. Students enter a trial
 * period to phase-fold the curve; the best period minimises scatter.
 *
 * Supported variable types (from NAAP settings.xml):
 *   - Pulsating stars   (RR Lyr, Cepheids: del Cep, MT Tel, PZ Aql, RR Leo)
 *   - Eclipsing binaries (TW Cas)
 *
 * TODO: ingest measurement data from PhotometryModel; implement phase-folding;
 *       derive period uncertainty; export light-curve data.
 */
import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import VSPNamespace from "../../VSPNamespace.js";

export const PERIOD_RANGE = new Range(0.1, 100);

export class AnalyzerModel {
  /** Trial period for phase-folding, in days. */
  public readonly trialPeriodProperty: NumberProperty;

  /** Zero-phase Julian epoch offset (days). */
  public readonly phaseOffsetProperty: NumberProperty;

  /** Whether the phase-folded view is active (vs raw light curve). */
  public readonly phaseFoldedProperty: BooleanProperty;

  public constructor(_tandem?: Tandem) {
    this.trialPeriodProperty = new NumberProperty(1.0, {
      range: PERIOD_RANGE,
    });

    this.phaseOffsetProperty = new NumberProperty(0.0);

    this.phaseFoldedProperty = new BooleanProperty(false);
  }

  /**
   * Returns the phase of a given Julian date under the current trial period.
   * Result is in [0, 1).
   */
  public getPhase(julianDate: number): number {
    const phase = ((julianDate - this.phaseOffsetProperty.value) / this.trialPeriodProperty.value) % 1;
    return phase < 0 ? phase + 1 : phase;
  }

  public step(_dt: number): void {
    // No time-dependent state — analysis is driven by user input, not a sim clock.
  }

  public reset(): void {
    this.trialPeriodProperty.reset();
    this.phaseOffsetProperty.reset();
    this.phaseFoldedProperty.reset();
  }
}

VSPNamespace.register("AnalyzerModel", AnalyzerModel);
