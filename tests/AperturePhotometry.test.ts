import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { differentialMagnitude, measureAperture } from "../src/common/model/AperturePhotometry.ts";
import { STARS } from "../src/common/model/StarFieldData.ts";

describe("differentialMagnitude", () => {
  it("returns −2.5 log₁₀(f1/f2) for positive fluxes", () => {
    expect(differentialMagnitude(100, 100)).toBeCloseTo(0, 10);
    expect(differentialMagnitude(1000, 100)).toBeCloseTo(-2.5, 10);
    expect(differentialMagnitude(100, 1000)).toBeCloseTo(2.5, 10);
  });

  it("returns null when either flux is non-positive", () => {
    expect(differentialMagnitude(0, 100)).toBeNull();
    expect(differentialMagnitude(100, 0)).toBeNull();
    expect(differentialMagnitude(-1, 100)).toBeNull();
  });
});

describe("measureAperture", () => {
  it("returns positive net flux on a bright catalogue star at epoch 0", () => {
    const star = STARS[0];
    expect(star).toBeDefined();
    if (star === undefined) {
      return;
    }
    const result = measureAperture(0, new Vector2(star.x, star.y), 5, 8, 12);
    expect(result.disc.totalPixels).toBeGreaterThan(0);
    expect(result.sky.totalPixels).toBeGreaterThan(0);
    expect(result.netFlux).toBeGreaterThan(0);
  });

  it("yields lower net flux far from any star than on a star centre", () => {
    const star = STARS[0];
    expect(star).toBeDefined();
    if (star === undefined) {
      return;
    }
    const onStar = measureAperture(0, new Vector2(star.x, star.y), 5, 8, 12);
    const offStar = measureAperture(0, new Vector2(10, 10), 5, 8, 12);
    expect(onStar.netFlux).toBeGreaterThan(offStar.netFlux);
  });
});
