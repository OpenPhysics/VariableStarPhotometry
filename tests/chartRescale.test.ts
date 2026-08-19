/**
 * chartRescale.test.ts
 *
 * Expanding a chart range must apply the new (larger) spacing before the
 * range, so leftover tiny ticks cannot explode TickLabelSet.
 */
import { describe, expect, it } from "vitest";
import { applyChartRescale } from "../src/analyzer/view/chartRescale.js";

describe("applyChartRescale", () => {
  it("sets spacing before range when the span grows", () => {
    const order: string[] = [];
    applyChartRescale(
      0.01,
      10,
      () => order.push("range"),
      () => order.push("spacing"),
    );
    expect(order).toEqual(["spacing", "range"]);
  });

  it("sets range before spacing when the span shrinks", () => {
    const order: string[] = [];
    applyChartRescale(
      10,
      0.01,
      () => order.push("range"),
      () => order.push("spacing"),
    );
    expect(order).toEqual(["range", "spacing"]);
  });
});
