const PALETTE = ["#e0575b", "#f0883e", "#e8c547", "#3fd0c9", "#a78bfa"];
const LEVELS = PALETTE.length;
const ZOOM_MS = 450;
const SHRUNK_SCALE = 0.12;
const GROWN_SCALE = 2.4;

function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.min(255, Math.max(0, v));
  const r = clamp(((n >> 16) & 0xff) + amount);
  const g = clamp(((n >> 8) & 0xff) + amount);
  const b = clamp((n & 0xff) + amount);
  return `rgb(${r} ${g} ${b})`;
}

function drawDoll(ctx: CanvasRenderingContext2D, cx: number, cy: number, baseH: number, scale: number, color: string, alpha: number): void {
  if (alpha <= 0) return;
  const h = baseH * scale;
  const bodyRx = h * 0.31;
  const bodyRy = h * 0.42;
  const bodyCy = cy + h * 0.02;
  const headR = h * 0.19;
  const headCy = cy - h * 0.34;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgb(0 0 0 / 35%)";
  ctx.shadowBlur = h * 0.04;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.ellipse(cx, bodyCy, bodyRx, bodyRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, headCy, headR, headR, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // headscarf edge
  ctx.fillStyle = shade(color, -35);
  ctx.beginPath();
  ctx.ellipse(cx, headCy + headR * 0.35, headR * 1.05, headR * 0.55, 0, 0, Math.PI, false);
  ctx.fill();

  // belt band with a row of small "flower" dots
  const beltY = bodyCy + bodyRy * 0.32;
  ctx.fillStyle = shade(color, -25);
  ctx.fillRect(cx - bodyRx, beltY - h * 0.035, bodyRx * 2, h * 0.07);
  ctx.fillStyle = "rgb(255 255 255 / 80%)";
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * bodyRx * 0.35, beltY, h * 0.014, 0, Math.PI * 2);
    ctx.fill();
  }

  // face
  ctx.fillStyle = "#2a2015";
  const eyeOffset = headR * 0.32;
  const eyeY = headCy + headR * 0.05;
  ctx.beginPath();
  ctx.arc(cx - eyeOffset, eyeY, h * 0.012, 0, Math.PI * 2);
  ctx.arc(cx + eyeOffset, eyeY, h * 0.012, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2a2015";
  ctx.lineWidth = Math.max(1, h * 0.006);
  ctx.beginPath();
  ctx.arc(cx, eyeY + headR * 0.22, headR * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.fillStyle = "rgb(224 87 91 / 35%)";
  ctx.beginPath();
  ctx.arc(cx - eyeOffset * 1.6, eyeY + headR * 0.18, h * 0.02, 0, Math.PI * 2);
  ctx.arc(cx + eyeOffset * 1.6, eyeY + headR * 0.18, h * 0.02, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function initAct4(): void {
  const canvas = document.getElementById("act-4-canvas") as HTMLCanvasElement | null;
  const fallback = document.getElementById("act-4-fallback");
  const openBtn = document.getElementById("act4-open") as HTMLButtonElement | null;
  const tally = document.getElementById("act4-tally");

  if (!canvas || !openBtn || !tally) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    fallback?.removeAttribute("hidden");
    canvas.hidden = true;
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dpr = 1;
  let level = 0;
  let rafId: number | null = null;

  const size = () => ({
    width: canvas.width / dpr,
    height: canvas.height / dpr,
  });

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawStatic = () => {
    const { width, height } = size();
    ctx.clearRect(0, 0, width, height);
    drawDoll(ctx, width / 2, height / 2, height * 0.78, 1, PALETTE[level] ?? PALETTE[0], 1);
  };

  const updateUI = () => {
    tally.textContent = `Doll ${level + 1} of ${LEVELS}`;
    openBtn.textContent = level >= LEVELS - 1 ? "That's the smallest — start over" : "Open the doll →";
  };

  const runZoom = (fromLevel: number, toLevel: number, opening: boolean) => {
    const { width, height } = size();
    const baseH = height * 0.78;
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ZOOM_MS);
      const eased = 1 - (1 - t) * (1 - t);
      ctx.clearRect(0, 0, width, height);

      const outScale = opening ? 1 + (GROWN_SCALE - 1) * eased : 1 - (1 - SHRUNK_SCALE) * eased;
      const inScale = opening ? SHRUNK_SCALE + (1 - SHRUNK_SCALE) * eased : GROWN_SCALE - (GROWN_SCALE - 1) * eased;

      drawDoll(ctx, width / 2, height / 2, baseH, outScale, PALETTE[fromLevel] ?? PALETTE[0], 1 - eased);
      drawDoll(ctx, width / 2, height / 2, baseH, inScale, PALETTE[toLevel] ?? PALETTE[0], eased);

      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
        level = toLevel;
        updateUI();
        drawStatic();
      }
    };
    rafId = requestAnimationFrame(step);
  };

  openBtn.addEventListener("click", () => {
    if (rafId !== null) return;
    const opening = level < LEVELS - 1;
    const fromLevel = level;
    const toLevel = opening ? level + 1 : 0;

    if (reduceMotion) {
      level = toLevel;
      updateUI();
      drawStatic();
      return;
    }
    runZoom(fromLevel, toLevel, opening);
  });

  window.addEventListener("resize", () => {
    resize();
    if (rafId === null) drawStatic();
  });

  resize();
  updateUI();
  drawStatic();
}
