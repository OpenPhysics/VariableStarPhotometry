import { describe, expect, it } from "vitest";
import { bestPeriod, pdmScan, pdmTheta } from "../src/common/model/PDMCalculator.ts";

// Build a deterministic synthetic light curve: a sinusoid of known period sampled
// at incommensurate intervals (so phases cover [0,1) rather than landing on a few
// discrete values, the way a real observing cadence does).
const TRUE_PERIOD = 5.0; // days
function syntheticCurve(period = TRUE_PERIOD): { epochs: number[]; mags: number[] } {
  const epochs: number[] = [];
  const mags: number[] = [];
  for (let i = 0; i < 80; i++) {
    const t = i * 0.37; // ~29.6-day baseline, incommensurate with the period
    epochs.push(t);
    mags.push(10 + 0.5 * Math.sin((2 * Math.PI * t) / period));
  }
  return { epochs, mags };
}

describe("pdmTheta", () => {
  it("scores the true period below any detuned period (theta is minimised at the right fold)", () => {
    const { epochs, mags } = syntheticCurve();
    const thetaTrue = pdmTheta(epochs, mags, TRUE_PERIOD);
    expect(thetaTrue).toBeLessThan(pdmTheta(epochs, mags, TRUE_PERIOD - 0.5));
    expect(thetaTrue).toBeLessThan(pdmTheta(epochs, mags, TRUE_PERIOD + 0.5));
  });

  it("returns 1 (undefined) when there are too few data points", () => {
    expect(pdmTheta([0, 1, 2], [10, 11, 10], 5)).toBe(1);
  });

  it("returns 1 for a non-positive trial period", () => {
    const { epochs, mags } = syntheticCurve();
    expect(pdmTheta(epochs, mags, 0)).toBe(1);
  });

  it("drives theta near zero for a densely, coherently folded curve", () => {
    // Regression guard for the interleaved binning: both Nc covers must occupy
    // disjoint bin blocks. A degenerate second cover (all points collapsing into
    // one bin) keeps within-bin scatter high and floors theta well above ~0.5
    // even at the true period; correct binning lets it fall toward 0.
    const period = 5.0;
    const epochs: number[] = [];
    const mags: number[] = [];
    for (let i = 0; i < 200; i++) {
      const t = i * 0.137; // dense, incommensurate sampling
      epochs.push(t);
      mags.push(10 + 0.5 * Math.sin((2 * Math.PI * t) / period));
    }
    expect(pdmTheta(epochs, mags, period)).toBeLessThan(0.3);
  });
});

describe("pdmScan + bestPeriod", () => {
  it("recovers the injected period from a scan", () => {
    const { epochs, mags } = syntheticCurve();
    const scan = pdmScan(epochs, mags, 4.5, 5.5, 201);
    const found = bestPeriod(scan);
    expect(found).not.toBeNull();
    expect(found as number).toBeCloseTo(TRUE_PERIOD, 1);
  });

  it("returns an empty scan for degenerate ranges", () => {
    const { epochs, mags } = syntheticCurve();
    expect(pdmScan(epochs, mags, 4.5, 5.5, 1)).toEqual([]);
    expect(pdmScan(epochs, mags, 5.5, 4.5, 50)).toEqual([]);
  });

  it("returns null for an empty scan", () => {
    expect(bestPeriod([])).toBeNull();
  });
});
