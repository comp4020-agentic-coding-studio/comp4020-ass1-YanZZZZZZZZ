import { runBatch, summarizeHunt, buildHistogram, HUNT_SIM_MAX_DISTANCE, type HuntBatch } from "./hunt-sim";

const DEPTH_COLOR = "#f0883e";

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

  if (!canvas || !densityInput || !densityValue || !countEl || !totalEl || !pctEl || !efficiencyEl || !badgeEl) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    fallback?.removeAttribute("hidden");
    canvas.hidden = true;
    return;
  }

  let dpr = 1;
  let batch: HuntBatch = runBatch(Number(densityInput.value));
  let depth = 3;
  let dragging = false;

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

  const draw = () => {
    const { width, height } = size();
    ctx.clearRect(0, 0, width, height);

    const bins = buildHistogram(batch);
    const maxCount = Math.max(1, ...bins.map((b) => b.count));
    const barGap = 2;
    const barWidth = width / bins.length - barGap;

    bins.forEach((bin, i) => {
      const x = (width / bins.length) * i;
      const barHeight = (bin.count / maxCount) * (height - 20);
      const triggered = bin.from < depth;
      ctx.fillStyle = triggered ? "#f85149" : "#3fb950";
      ctx.fillRect(x, height - barHeight, Math.max(1, barWidth), barHeight);
    });

    const depthX = xForDistance(depth);
    ctx.strokeStyle = DEPTH_COLOR;
    ctx.lineWidth = 2;
    ctx.shadowColor = DEPTH_COLOR;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(depthX, 0);
    ctx.lineTo(depthX, height);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const setDepthFromClientX = (clientX: number) => {
    const rect = canvas.getBoundingClientRect();
    depth = distanceForX(clientX - rect.left);
    updateReadout();
    draw();
  };

  canvas.addEventListener("pointerdown", (event) => {
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
