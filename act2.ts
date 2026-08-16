import { runBatch, summarizeHunt, buildHistogram, HUNT_SIM_MAX_DISTANCE, type HuntBatch } from "./hunt-sim";
import { themeAccent } from "./theme";

export function initAct2(): void {
  const canvas = document.getElementById("act-2-canvas") as HTMLCanvasElement | null;
  const fallback = document.getElementById("act-2-fallback");
  const densityInput = document.getElementById("act2-density") as HTMLInputElement | null;
  const densityValue = document.getElementById("act2-density-value");
  const countEl = document.getElementById("act2-count");
  const totalEl = document.getElementById("act2-total");
  const pctEl = document.getElementById("act2-pct");
  const efficiencyEl = document.getElementById("act2-efficiency");
  const badgeEl = document.getElementById("act2-badge");
  const guessHint = document.getElementById("act2-guess-hint");
  const controlsPanel = document.getElementById("act-2-controls");
  const readoutPanel = document.getElementById("act2-readout");

  if (
    !canvas ||
    !densityInput ||
    !densityValue ||
    !countEl ||
    !totalEl ||
    !pctEl ||
    !efficiencyEl ||
    !badgeEl ||
    !guessHint ||
    !controlsPanel ||
    !readoutPanel
  ) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    fallback?.removeAttribute("hidden");
    canvas.hidden = true;
    return;
  }

  const accent = themeAccent(canvas);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FLASH_MS = 220;
  let dpr = 1;
  let batch: HuntBatch = runBatch(Number(densityInput.value));
  let depth = 3;
  let dragging = false;
  let guessed = false;
  let guessDistance = 0;
  const flashes = new Map<number, number>(); // bin index -> flash start time
  let flashRaf: number | null = null;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const size = () => ({
    width: canvas.width / dpr,
    height: canvas.height / dpr,
  });

  const xForDistance = (d: number): number => {
    const { width } = size();
    return (d / HUNT_SIM_MAX_DISTANCE) * width;
  };

  const distanceForX = (x: number): number => {
    const { width } = size();
    return Math.min(HUNT_SIM_MAX_DISTANCE, Math.max(0, (x / width) * HUNT_SIM_MAX_DISTANCE));
  };

  const updateReadout = () => {
    const summary = summarizeHunt(batch, depth);
    countEl.textContent = String(summary.triggered);
    totalEl.textContent = String(summary.total);
    pctEl.textContent = `${summary.pct.toFixed(0)}%`;
    efficiencyEl.textContent = summary.efficiency.toFixed(0);

    if (summary.pct >= 60) {
      badgeEl.textContent = "Highly predictable";
    } else if (summary.pct >= 25) {
      badgeEl.textContent = "Clustered";
    } else {
      badgeEl.textContent = "Spread out";
    }
  };

  const peakDistance = (): number => {
    const bins = buildHistogram(batch);
    const peak = bins.reduce((best, b) => (b.count > best.count ? b : best), bins[0]);
    return (peak.from + peak.to) / 2;
  };

  const drawGuessMarker = () => {
    const { height } = size();
    const x = xForDistance(guessDistance);
    ctx.save();
    ctx.fillStyle = "#e6e8ee";
    ctx.beginPath();
    ctx.moveTo(x - 6, 0);
    ctx.lineTo(x + 6, 0);
    ctx.lineTo(x, 10);
    ctx.closePath();
    ctx.fill();
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("your guess", x, height - 4);
    ctx.restore();
  };

  const draw = () => {
    const { width, height } = size();
    ctx.clearRect(0, 0, width, height);

    if (!guessed) {
      ctx.strokeStyle = "#232838";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - 1);
      ctx.lineTo(width, height - 1);
      ctx.stroke();
      return;
    }

    const bins = buildHistogram(batch);
    const maxCount = Math.max(1, ...bins.map((b) => b.count));
    const barGap = 2;
    const barWidth = width / bins.length - barGap;

    const now = performance.now();
    bins.forEach((bin, i) => {
      const x = (width / bins.length) * i;
      const barHeight = (bin.count / maxCount) * (height - 20);
      const triggered = bin.from < depth;
      ctx.fillStyle = triggered ? "#f85149" : "#3fb950";
      ctx.fillRect(x, height - barHeight, Math.max(1, barWidth), barHeight);

      const flashStart = flashes.get(i);
      if (flashStart !== undefined) {
        const t = (now - flashStart) / FLASH_MS;
        if (t >= 1) {
          flashes.delete(i);
        } else {
          ctx.fillStyle = `rgb(255 255 255 / ${(1 - t) * 0.85})`;
          ctx.fillRect(x, height - barHeight, Math.max(1, barWidth), barHeight);
        }
      }
    });

    const depthX = xForDistance(depth);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(depthX, 0);
    ctx.lineTo(depthX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    drawGuessMarker();
  };

  const runFlashLoop = () => {
    if (flashRaf !== null) return;
    const step = () => {
      draw();
      if (flashes.size > 0) {
        flashRaf = requestAnimationFrame(step);
      } else {
        flashRaf = null;
      }
    };
    step();
  };

  const triggerFlashes = (newDepth: number, oldDepth: number) => {
    if (reduceMotion) return;
    const bins = buildHistogram(batch);
    const now = performance.now();
    bins.forEach((bin, i) => {
      const justCaptured = bin.from < newDepth && bin.from >= oldDepth;
      const justReleased = bin.from < oldDepth && bin.from >= newDepth;
      if (justCaptured || justReleased) flashes.set(i, now);
    });
    if (flashes.size > 0) runFlashLoop();
  };

  const setDepthFromClientX = (clientX: number) => {
    const rect = canvas.getBoundingClientRect();
    const previousDepth = depth;
    depth = distanceForX(clientX - rect.left);
    triggerFlashes(depth, previousDepth);
    updateReadout();
    draw();
  };

  const reveal = (clientX: number) => {
    const rect = canvas.getBoundingClientRect();
    guessDistance = distanceForX(clientX - rect.left);
    guessed = true;
    depth = guessDistance;
    controlsPanel.hidden = false;
    readoutPanel.hidden = false;
    const peak = peakDistance();
    const diff = Math.abs(guessDistance - peak);
    const verdict = diff <= 0.5 ? "Sharp guess — that's almost exactly it." : "See the gap — most stops weren't where you guessed.";
    guessHint.textContent = `You guessed ${guessDistance.toFixed(1)}% — the real cluster peaks around ${peak.toFixed(1)}%. ${verdict}`;
    updateReadout();
    draw();
  };

  canvas.addEventListener("pointerdown", (event) => {
    if (!guessed) {
      reveal(event.clientX);
      return;
    }
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    setDepthFromClientX(event.clientX);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    setDepthFromClientX(event.clientX);
  });
  const release = () => {
    dragging = false;
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  densityInput.addEventListener("input", () => {
    densityValue.textContent = densityInput.value;
    batch = runBatch(Number(densityInput.value));
    flashes.clear();
    updateReadout();
    draw();
  });

  window.addEventListener("resize", () => {
    resize();
    draw();
  });

  resize();
  updateReadout();
  draw();
}
