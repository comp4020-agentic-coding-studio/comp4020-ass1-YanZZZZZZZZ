import { mulberry32 } from "./rng";

export interface GlyphBox {
  width: number;
  height: number;
}

export interface GlyphEra {
  key: string;
  roughness: number;
}

function seedFromString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return hash;
}

export function drawGlyphImpression(
  ctx: CanvasRenderingContext2D,
  box: GlyphBox,
  char: string,
  era: GlyphEra,
): void {
  const { width, height } = box;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const fontSize = Math.min(width, height) * 0.6;
  ctx.font = `${fontSize}px "Noto Serif SC", "Songti SC", serif`;

  const cx = width / 2;
  const cy = height / 2;
  const roughness = Math.max(0, Math.min(1, era.roughness));

  if (roughness === 0) {
    ctx.fillStyle = "#241f1a";
    ctx.fillText(char, cx, cy);
    ctx.restore();
    return;
  }

  const passes = 3 + Math.round(roughness * 5);
  const jitter = fontSize * 0.09 * roughness;
  const rng = mulberry32(seedFromString(`${char}:${era.key}`));

  ctx.fillStyle = "rgba(36, 31, 26, 0.35)";
  for (let i = 0; i < passes; i++) {
    const dx = (rng() - 0.5) * jitter;
    const dy = (rng() - 0.5) * jitter;
    const rotation = (rng() - 0.5) * 0.12 * roughness;
    ctx.save();
    ctx.translate(cx + dx, cy + dy);
    ctx.rotate(rotation);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}
