import {
  buildAct1Path,
  ACT1_ENTRY_CANDLE_INDEX,
  ACT1_SWING_LOW_INDEX,
  ACT1_STOP_MIN,
  ACT1_STOP_MAX_OFFSET,
  type Candle,
} from "./candles";
import { ChartRenderer } from "./chart-renderer";
import { animateCount } from "./animate-count";
import { themeAccent } from "./theme";

const REVEAL_MS = 200;
const STOP_LINE_ID = "stop";

export function initAct1(): void {
  const canvas = document.getElementById("act-1-canvas") as HTMLCanvasElement | null;
  const fallback = document.getElementById("act-1-fallback");
  const sizeInput = document.getElementById("act1-size") as HTMLInputElement | null;
  const sizeValue = document.getElementById("act1-size-value");
  const hint = document.getElementById("act1-hint");
  const confirmBtn = document.getElementById("act1-confirm") as HTMLButtonElement | null;
  const resultPanel = document.getElementById("act1-result");
  const tally = document.getElementById("act1-tally");

  if (!canvas || !sizeInput || !sizeValue || !hint || !confirmBtn || !resultPanel || !tally) {
    return;
  }

  let renderer: ChartRenderer;
  try {
    renderer = new ChartRenderer(canvas);
  } catch {
    fallback?.removeAttribute("hidden");
    canvas.hidden = true;
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const accent = themeAccent(canvas);

  let attempt = 1;
  let path: Candle[] = [];
  let entryPrice = 0;
  let stopPrice = 0;
  let revealTimer: ReturnType<typeof setTimeout> | null = null;
  let confirmed = false;

  const positionMultiplier = () => Number(sizeInput.value);

  const clampStop = (price: number): number => {
    const swingLow = path[ACT1_SWING_LOW_INDEX]?.low ?? entryPrice;
    const min = swingLow - ACT1_STOP_MAX_OFFSET;
    const max = entryPrice - ACT1_STOP_MIN;
    return Math.min(max, Math.max(min, price));
  };

  const resize = () => {
    renderer.resize();
    renderer.draw();
  };

  const startAttempt = () => {
    confirmed = false;
    if (revealTimer) clearTimeout(revealTimer);
    resultPanel.hidden = true;
    resultPanel.textContent = "";
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Confirm stop & watch";
    sizeInput.disabled = false;
    hint.textContent = "Watching price climb…";
    tally.textContent = `Attempt ${attempt}`;

    path = buildAct1Path(1000 + attempt * 37);
    entryPrice = path[ACT1_ENTRY_CANDLE_INDEX].close;
    stopPrice = clampStop(path[ACT1_SWING_LOW_INDEX].low - ACT1_STOP_MIN);

    renderer.setVisibleCount(path.length);
    const visible = path.slice(0, ACT1_ENTRY_CANDLE_INDEX + 1);
    renderer.setCandles(visible);
    renderer.setLine(STOP_LINE_ID, {
      price: stopPrice,
      color: accent,
      label: "your stop",
      draggable: true,
    });
    renderer.onLineDrag(STOP_LINE_ID, (price) => {
      stopPrice = clampStop(price);
      const distance = entryPrice - stopPrice;
      hint.textContent = `Stop set ${distance.toFixed(2)} below entry.`;
    });
    resize();
    hint.textContent = `Stop set ${(entryPrice - stopPrice).toFixed(2)} below entry.`;
  };

  const finish = (stoppedAtIndex: number | null) => {
    const finalCandle = path[path.length - 1];
    const size = positionMultiplier();
    resultPanel.hidden = false;

    if (stoppedAtIndex !== null) {
      const loss = (entryPrice - stopPrice) * size * 10;
      const wouldHaveMadeAt = finalCandle.close;
      const wouldHaveGained = (wouldHaveMadeAt - entryPrice) * size * 10;
      resultPanel.innerHTML = `
        <p><strong>Stopped out.</strong> Price swept your stop before reversing.</p>
        <p>You lost <strong id="act1-loss">$0</strong> on this trade.</p>
        <p class="hint">Had you not been stopped, you'd be ${wouldHaveGained >= 0 ? "up" : "down"} $${Math.abs(wouldHaveGained).toFixed(0)} by now — the level was hunted, then reversed.</p>
      `;
      const lossEl = document.getElementById("act1-loss");
      if (lossEl) {
        if (reduceMotion) {
          lossEl.textContent = `$${loss.toFixed(0)}`;
        } else {
          animateCount(lossEl, 0, loss, 700, (n) => `$${n.toFixed(0)}`);
        }
      }
    } else {
      const gain = (finalCandle.close - entryPrice) * size * 10;
      resultPanel.innerHTML = `
        <p><strong>Stop never touched.</strong> Your position rode it out.</p>
        <p>You're ${gain >= 0 ? "up" : "down"} <strong id="act1-gain">$0</strong>.</p>
      `;
      const gainEl = document.getElementById("act1-gain");
      if (gainEl) {
        if (reduceMotion) {
          gainEl.textContent = `$${Math.abs(gain).toFixed(0)}`;
        } else {
          animateCount(gainEl, 0, Math.abs(gain), 700, (n) => `$${n.toFixed(0)}`);
        }
      }
    }

    confirmBtn.disabled = false;
    confirmBtn.textContent = "Try again";
    attempt += 1;
  };

  const revealRemaining = () => {
    let index = ACT1_ENTRY_CANDLE_INDEX + 1;
    let stoppedAtIndex: number | null = null;

    const step = () => {
      if (index >= path.length) {
        finish(stoppedAtIndex);
        return;
      }
      const revealed = path.slice(0, index + 1);
      renderer.setCandles(revealed);
      renderer.draw();

      if (stoppedAtIndex === null && path[index].low <= stopPrice) {
        stoppedAtIndex = index;
        renderer.setLine(STOP_LINE_ID, {
          price: stopPrice,
          color: "#f85149",
          label: "stopped out",
          draggable: false,
          dashed: true,
        });
        hint.textContent = "Stopped out — watching what happens next…";
        renderer.draw();
      }

      index += 1;
      revealTimer = setTimeout(step, REVEAL_MS);
    };

    step();
  };

  confirmBtn.addEventListener("click", () => {
    if (confirmed) {
      startAttempt();
      return;
    }
    confirmed = true;
    confirmBtn.disabled = true;
    sizeInput.disabled = true;
    hint.textContent = "Watching what happens…";

    if (reduceMotion) {
      let stoppedAtIndex: number | null = null;
      for (let i = ACT1_ENTRY_CANDLE_INDEX + 1; i < path.length; i++) {
        if (path[i].low <= stopPrice) {
          stoppedAtIndex = i;
          break;
        }
      }
      renderer.setCandles(path);
      renderer.draw();
      finish(stoppedAtIndex);
    } else {
      revealRemaining();
    }
  });

  sizeInput.addEventListener("input", () => {
    sizeValue.textContent = `${sizeInput.value}x`;
  });

  window.addEventListener("resize", resize);
  startAttempt();
}
