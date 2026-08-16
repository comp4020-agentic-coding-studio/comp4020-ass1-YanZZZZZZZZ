import { mulberry32, gaussian } from "./rng";

export const HUNT_SIM_MAX_DISTANCE = 10; // percent below current price

export interface HuntBatch {
  distances: number[];
}

const BATCH_SIZE = 1000;

export function runBatch(density: number, seed = 42): HuntBatch {
  const rng = mulberry32(seed);
  const stddev = Math.max(0.4, 4.5 - density * 0.35); // denser clustering -> tighter spread
  const mean = 3;
  const distances: number[] = [];
  for (let i = 0; i < BATCH_SIZE; i++) {
    const d = mean + gaussian(rng) * stddev;
    distances.push(Math.min(HUNT_SIM_MAX_DISTANCE, Math.max(0, d)));
  }
  return { distances };
}

export interface HuntSummary {
  triggered: number;
  total: number;
  pct: number;
  efficiency: number;
}

export function summarizeHunt(batch: HuntBatch, depth: number): HuntSummary {
  const triggered = batch.distances.filter((d) => d <= depth).length;
  const total = batch.distances.length;
  const pct = total === 0 ? 0 : (triggered / total) * 100;
  const efficiency = depth > 0 ? triggered / depth : 0;
  return { triggered, total, pct, efficiency };
}

export interface HistogramBin {
  from: number;
  to: number;
  count: number;
}

export function buildHistogram(batch: HuntBatch, binCount = 24): HistogramBin[] {
  const binWidth = HUNT_SIM_MAX_DISTANCE / binCount;
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, i) => ({
    from: i * binWidth,
    to: (i + 1) * binWidth,
    count: 0,
  }));
  for (const d of batch.distances) {
    const idx = Math.min(binCount - 1, Math.floor(d / binWidth));
    const bin = bins[idx];
    if (bin) bin.count += 1;
  }
  return bins;
}
