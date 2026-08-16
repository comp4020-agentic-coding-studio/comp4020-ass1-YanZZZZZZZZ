import { mulberry32 } from "./rng";

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
}

// Phase 1 (rally) is candles 0-7. The pullback that follows forms the swing
// low a stop would naturally sit under, then the entry candle marks where a
// trader would plausibly open the position this act is about.
export const ACT1_SWING_LOW_INDEX = 8;
export const ACT1_ENTRY_CANDLE_INDEX = 9;
export const ACT1_STOP_MIN = 2;
export const ACT1_STOP_MAX_OFFSET = 6;

export function buildAct1Path(seed: number): Candle[] {
  const rng = mulberry32(seed);
  const candles: Candle[] = [];
  let price = 100;

  const pushCandle = (drift: number, vol: number) => {
    const open = price;
    const noise = (rng() - 0.5) * vol;
    const close = open + drift + noise;
    const high = Math.max(open, close) + rng() * vol * 0.4;
    const low = Math.min(open, close) - rng() * vol * 0.4;
    candles.push({ open, high, low, close });
    price = close;
  };

  for (let i = 0; i < 8; i++) pushCandle(0.9, 1.2); // rally: confidence builds
  for (let i = 0; i < 2; i++) pushCandle(-0.6, 1.0); // pullback: swing low + entry
  for (let i = 0; i < 6; i++) pushCandle(1.1, 1.3); // FOMO: price pushes higher
  for (let i = 0; i < 5; i++) pushCandle(-1.4, 1.6); // reversal: stops get swept
  for (let i = 0; i < 6; i++) pushCandle(0.8, 1.1); // recovery: price moves on without you

  return candles;
}
