/**
 * chartRescale.ts
 *
 * Bamboo's TickLabelSet.update runs on every range or spacing change.
 * Expanding an axis first (PDM zoom-out, light-curve y auto-scale) while a
 * leftover tiny spacing is still in force generates tens of thousands of
 * labels and crashes the renderer.
 */
export function applyChartRescale(
  oldSpan: number,
  newSpan: number,
  setRange: () => void,
  setSpacing: () => void,
): void {
  if (newSpan >= oldSpan) {
    setSpacing();
    setRange();
  } else {
    setRange();
    setSpacing();
  }
}
