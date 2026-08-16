import { mulberry32 } from "./rng";
import { runBatch, HUNT_SIM_MAX_DISTANCE } from "./hunt-sim";
import { themeAccent, rgba } from "./theme";
import {
  computeLayout,
  createParticles,
  retarget,
  stepParticles,
  snapToTarget,
  type Particle,
  type PoolLayout,
} from "./particle-flow";

const PARTICLE_COUNT = 240;

function uniformDistances(count: number, rng: () => number): number[] {
  return Array.from({ length: count }, () => rng() * HUNT_SIM_MAX_DISTANCE);
}

export function initAct3(): void {
  const canvas = document.getElementById("act-3-canvas") as HTMLCanvasElement | null;
  const fallback = document.getElementById("act-3-fallback");
  const runBtn = document.getElementById("act3-runday") as HTMLButtonElement | null;
  const depthInput = document.getElementById("act3-depth") as HTMLInputElement | null;
  const depthValue = document.getElementById("act3-depth-value");
  const whatIfBtn = document.getElementById("act3-whatif") as HTMLButtonElement | null;
  const readout = document.getElementById("act3-readout");
  const callout = document.getElementById("act3-callout");
  const exploreHint = document.getElementById("act3-explore-hint");

  if (!canvas || !runBtn || !depthInput || !depthValue || !whatIfBtn || !readout || !callout || !exploreHint) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    fallback?.removeAttribute("hidden");
    canvas.hidden = true;
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rng = mulberry32(7);
  const accent = themeAccent(canvas);

  let dpr = 1;
  let layout: PoolLayout;
  let particles: Particle[] = [];
  let spreadOut = false;
  let hasRun = false;
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
    const { width, height } = size();
    layout = computeLayout(width, height);
  };

  const distances = () =>
    spreadOut ? uniformDistances(PARTICLE_COUNT, rng) : runBatch(6, 99).distances.slice(0, PARTICLE_COUNT);

  const buildParticles = () => {
    particles = createParticles(distances(), layout.source, rng);
  };

  const drawPool = (pool: { x: number; y: number; radius: number; label: string }, intensity: number) => {
    if (!ctx) return;
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 6 + intensity * 24;
    ctx.beginPath();
    ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(accent, 0.4 + intensity * 0.6);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#8b93a7";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pool.label, pool.x, pool.y + pool.radius + 16);
  };

  const draw = () => {
    const { width, height } = size();
    ctx.clearRect(0, 0, width, height);

    const total = Math.max(1, particles.length);
    const huntedFraction = hasRun ? particles.filter((p) => p.hunted).length / total : 0;
    drawPool(layout.source, 0.15);
    drawPool(layout.survived, hasRun ? 1 - huntedFraction : 0.15);
    drawPool(layout.hunted, huntedFraction);

    for (const p of particles) {
      ctx.strokeStyle = p.hunted ? "rgb(248 81 73 / 40%)" : "rgb(63 185 80 / 40%)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.prevX, p.prevY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      ctx.fillStyle = p.hunted ? "#f85149" : "#3fb950";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const animate = () => {
    const stillMoving = stepParticles(particles);
    draw();
    if (stillMoving) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  };

  const startAnimation = () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    if (reduceMotion) {
      particles.forEach(snapToTarget);
      draw();
    } else {
      rafId = requestAnimationFrame(animate);
    }
  };

  const applyDepth = (depth: number) => {
    let huntedCount = 0;
    for (const p of particles) {
      p.hunted = p.distance <= depth;
      if (p.hunted) huntedCount += 1;
      retarget(p, p.hunted ? layout.hunted : layout.survived, rng);
    }
    startAnimation();

    const pct = (huntedCount / particles.length) * 100;
    readout.textContent = `${pct.toFixed(0)}% of retail capital was swept up before the reversal.`;
    callout.hidden = false;
    callout.textContent = spreadOut
      ? `With stops spread out, only ${pct.toFixed(0)}% get caught at the same depth.`
      : `Clustered stops mean ${pct.toFixed(0)}% get caught at once — a single, predictable level.`;
  };

  runBtn.addEventListener("click", () => {
    hasRun = true;
    applyDepth(Number(depthInput.value));
    exploreHint.hidden = false;
    runBtn.textContent = "Run again →";
  });

  depthInput.addEventListener("input", () => {
    depthValue.textContent = `${Number(depthInput.value).toFixed(1)}%`;
    if (hasRun) applyDepth(Number(depthInput.value));
  });

  whatIfBtn.addEventListener("click", () => {
    spreadOut = !spreadOut;
    whatIfBtn.textContent = spreadOut ? "Back to clustered stops" : "What if stops were spread out?";
    buildParticles();
    if (hasRun) applyDepth(Number(depthInput.value));
    else draw();
  });

  window.addEventListener("resize", () => {
    resize();
    buildParticles();
    draw();
  });

  resize();
  buildParticles();
  draw();
}
