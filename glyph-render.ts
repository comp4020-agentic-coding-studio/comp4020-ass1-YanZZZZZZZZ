import { mulberry32 } from "./rng";
import { PICTOGRAPHS, type Stroke } from "./pictographs";

export interface GlyphBox {
  width: number;
  height: number;
}

export interface GlyphEra {
  key: string;
  roughness: number;
}

const PICTOGRAPH_ERAS = new Set(["oracle", "bronze", "seal"]);

function seedFromString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return hash;
}

function mapPoint(x: number, y: number, box: GlyphBox): [number, number] {
  const scale = (Math.min(box.width, box.height) / 100) * 0.8;
  const offsetX = box.width / 2 - 50 * scale;
  const offsetY = box.height / 2 - 50 * scale;
  return [x * scale + offsetX, y * scale + offsetY];
}

function drawOracle(ctx: CanvasRenderingContext2D, box: GlyphBox, strokes: Stroke[], seed: number): void {
  const rng = mulberry32(seed);
  const jitter = Math.min(box.width, box.height) * 0.012;
  ctx.strokeStyle = "#241f1a";
  ctx.lineWidth = Math.max(1.5, Math.min(box.width, box.height) * 0.018);
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";
  for (const stroke of strokes) {
    if (stroke.type === "circle") {
      const [cx, cy] = mapPoint(stroke.cx, stroke.cy, box);
      const r = stroke.r * ((Math.min(box.width, box.height) / 100) * 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    ctx.beginPath();
    stroke.pts.forEach(([x, y], i) => {
      const [mx, my] = mapPoint(x, y, box);
      const dx = (rng() - 0.5) * jitter;
      const dy = (rng() - 0.5) * jitter;
      if (i === 0) ctx.moveTo(mx + dx, my + dy);
      else ctx.lineTo(mx + dx, my + dy);
    });
    ctx.stroke();
  }
}

function drawBronze(ctx: CanvasRenderingContext2D, box: GlyphBox, strokes: Stroke[]): void {
  const unit = Math.min(box.width, box.height) / 100;
  ctx.strokeStyle = "#2c241c";
  ctx.fillStyle = "#2c241c";
  ctx.lineWidth = Math.max(2.5, unit * 3.4);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const stroke of strokes) {
    if (stroke.type === "circle") {
      const [cx, cy] = mapPoint(stroke.cx, stroke.cy, box);
      ctx.beginPath();
      ctx.arc(cx, cy, stroke.r * unit * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    ctx.beginPath();
    stroke.pts.forEach(([x, y], i) => {
      const [mx, my] = mapPoint(x, y, box);
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    });
    ctx.stroke();
    const [jx, jy] = mapPoint(stroke.pts[0][0], stroke.pts[0][1], box);
    ctx.beginPath();
    ctx.arc(jx, jy, ctx.lineWidth * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeal(ctx: CanvasRenderingContext2D, box: GlyphBox, strokes: Stroke[]): void {
  const unit = Math.min(box.width, box.height) / 100;
  ctx.save();
  ctx.translate(box.width / 2, box.height / 2);
  ctx.scale(0.85, 1.22);
  ctx.translate(-box.width / 2, -box.height / 2);
  ctx.strokeStyle = "#241f1a";
  ctx.lineWidth = Math.max(1.8, unit * 2.2);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const stroke of strokes) {
    if (stroke.type === "circle") {
      const [cx, cy] = mapPoint(stroke.cx, stroke.cy, box);
      ctx.beginPath();
      ctx.arc(cx, cy, stroke.r * unit * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    ctx.beginPath();
    const pts = stroke.pts.map(([x, y]) => mapPoint(x, y, box));
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [cx, cy] = pts[i];
      const midX = (px + cx) / 2;
      const midY = (py + cy) / 2;
      ctx.quadraticCurveTo(px, py, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0], last[1]);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFontGlyph(ctx: CanvasRenderingContext2D, box: GlyphBox, char: string, era: GlyphEra): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const cx = box.width / 2;
  const cy = box.height / 2;
  ctx.translate(cx, cy);
  if (era.key === "clerical") ctx.scale(1.15, 0.82);
  ctx.translate(-cx, -cy);

  const fontSize = Math.min(box.width, box.height) * 0.6;
  ctx.font = `${fontSize}px "Noto Serif SC", "Songti SC", serif`;

  const roughness = Math.max(0, Math.min(1, era.roughness));
  if (roughness === 0) {
    ctx.fillStyle = "#241f1a";
    ctx.fillText(char, cx, cy);
    ctx.restore();
    return;
  }

  const passes = 2 + Math.round(roughness * 3);
  const jitter = fontSize * 0.05 * roughness;
  const rng = mulberry32(seedFromString(`${char}:${era.key}`));

  ctx.fillStyle = "rgba(36, 31, 26, 0.45)";
  for (let i = 0; i < passes; i++) {
    const dx = (rng() - 0.5) * jitter;
    const dy = (rng() - 0.5) * jitter;
    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

export function drawGlyphImpression(
  ctx: CanvasRenderingContext2D,
  box: GlyphBox,
  char: string,
  era: GlyphEra,
): void {
  ctx.clearRect(0, 0, box.width, box.height);
  ctx.save();

  const strokes = PICTOGRAPHS[char];
  if (strokes && PICTOGRAPH_ERAS.has(era.key)) {
    if (era.key === "oracle") drawOracle(ctx, box, strokes, seedFromString(`${char}:${era.key}`));
    else if (era.key === "bronze") drawBronze(ctx, box, strokes);
    else drawSeal(ctx, box, strokes);
    ctx.restore();
    return;
  }

  drawFontGlyph(ctx, box, char, era);
  ctx.restore();
}
