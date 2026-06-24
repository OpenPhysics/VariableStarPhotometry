/**
 * PDMCalculator.ts
 *
 * Phase Dispersion Minimization (Stellingwerf 1978) — a period-finding
 * statistic that works on unevenly-sampled, non-sinusoidal light curves
 * (ideal for the RR Lyrae / Cepheid / eclipsing-binary curves in this sim).
 *
 * For a trial period P the observations are phase-folded and binned; θ compares
 * the pooled within-bin variance to the overall variance:
 *
 *   φ_i  = ((t_i − t₀) / P) mod 1                       (phase of point i)
 *   bin j gathers points with φ ∈ [j/nBins, (j+1)/nBins)
 *   σ²_j = sample variance within bin j      (divisor n_j − 1)
 *   σ²   = sample variance of all magnitudes (divisor N − 1)
 *   θ    = Σ_j (n_j − 1)·σ²_j  /  [ (N − nBins)·σ² ]
 *
 * θ → 0 when the trial period coherently folds the data (small scatter within
 * bins); θ ≈ 1 for an incorrect period. The best period minimises θ.
 */

export type PdmPoint = { period: number; theta: number };

/**
 * Computes the PDM θ statistic for a single trial period.
 *
 * @param epochs  Julian dates (days)
 * @param mags    corresponding magnitudes
 * @param period  trial period (days)
 * @param nBins   number of phase bins (default 5)
 * @param t0      zero-phase reference epoch (default 0)
 * @returns θ ≥ 0 (small → good period); returns 1 when undefined (too few data).
 */
export function pdmTheta(
  epochs: readonly number[],
  mags: readonly number[],
  period: number,
  nBins = 5,
  t0 = 0,
): number {
  const N = mags.length;
  if (N < nBins + 1 || period <= 0) {
    return 1;
  }

  // Overall sample variance σ².
  let sum = 0;
  for (let i = 0; i < N; i++) {
    sum += mags[i] as number;
  }
  const mean = sum / N;
  let sse = 0;
  for (let i = 0; i < N; i++) {
    const d = (mags[i] as number) - mean;
    sse += d * d;
  }
  const overallVariance = sse / (N - 1);
  if (overallVariance === 0) {
    return 1;
  }

  // Per-bin running sums for variance via Σx² − (Σx)²/n.
  const binCount = new Array<number>(nBins).fill(0);
  const binSum = new Array<number>(nBins).fill(0);
  const binSumSq = new Array<number>(nBins).fill(0);

  for (let i = 0; i < N; i++) {
    let phase = (((epochs[i] as number) - t0) / period) % 1;
    if (phase < 0) {
      phase += 1;
    }
    let j = Math.floor(phase * nBins);
    if (j >= nBins) {
      j = nBins - 1; // guard against phase exactly 1 from FP rounding
    }
    const m = mags[i] as number;
    binCount[j] = (binCount[j] as number) + 1;
    binSum[j] = (binSum[j] as number) + m;
    binSumSq[j] = (binSumSq[j] as number) + m * m;
  }

  // Σ_j (n_j − 1)·σ²_j = Σ_j [ Σx² − (Σx)²/n_j ].
  let pooledSse = 0;
  for (let j = 0; j < nBins; j++) {
    const n = binCount[j] as number;
    if (n > 1) {
      pooledSse += (binSumSq[j] as number) - (binSum[j] as number) ** 2 / n;
    }
  }

  return pooledSse / ((N - nBins) * overallVariance);
}

/**
 * Scans trial periods across [periodMin, periodMax] in `nSteps` equal steps.
 */
export function pdmScan(
  epochs: readonly number[],
  mags: readonly number[],
  periodMin: number,
  periodMax: number,
  nSteps: number,
  nBins = 5,
  t0 = 0,
): PdmPoint[] {
  const results: PdmPoint[] = [];
  if (nSteps < 2 || periodMax <= periodMin) {
    return results;
  }
  const dp = (periodMax - periodMin) / (nSteps - 1);
  for (let i = 0; i < nSteps; i++) {
    const period = periodMin + i * dp;
    results.push({ period, theta: pdmTheta(epochs, mags, period, nBins, t0) });
  }
  return results;
}

/** Returns the period with the smallest θ in a scan, or null if empty. */
export function bestPeriod(scan: readonly PdmPoint[]): number | null {
  let best: PdmPoint | null = null;
  for (const point of scan) {
    if (best === null || point.theta < best.theta) {
      best = point;
    }
  }
  return best ? best.period : null;
}
