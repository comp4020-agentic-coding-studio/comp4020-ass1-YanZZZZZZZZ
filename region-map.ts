export interface RegionBox {
  width: number;
  height: number;
}

export interface RegionEra {
  key: string;
  regionShort: string;
}

function wrapLabel(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current) lines.push(current);

  if (lines.length > maxLines) lines.length = maxLines;
  const last = lines[lines.length - 1];
  if (last && ctx.measureText(last).width > maxWidth) {
    let truncated = last;
    while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    lines[lines.length - 1] = `${truncated}…`;
  }
  return lines;
}

function drawHorizontal(
  ctx: CanvasRenderingContext2D,
  box: RegionBox,
  eras: RegionEra[],
  activeKey: string,
): void {
  const { width, height } = box;
  const padding = Math.min(width, height) * 0.12;
  const usableW = width - padding * 2;
  const lineY = height * 0.42;
  const step = eras.length > 1 ? usableW / (eras.length - 1) : 0;

  ctx.strokeStyle = "rgba(179, 85, 47, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, lineY);
  ctx.lineTo(width - padding, lineY);
  ctx.stroke();

  const labelWidth = step > 0 ? step * 0.95 : width;
  const fontSize = Math.max(9, Math.min(13, height * 0.055));
  const lineHeight = fontSize * 1.2;

  eras.forEach((era, i) => {
    const x = padding + step * i;
    const active = era.key === activeKey;
    const radius = active ? 8 : 5;
    const isFirst = i === 0;
    const isLast = i === eras.length - 1;

    ctx.beginPath();
    ctx.fillStyle = active ? "#b3552f" : "rgba(36, 31, 26, 0.35)";
    ctx.arc(x, lineY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = active ? "#241f1a" : "rgba(36, 31, 26, 0.55)";
    ctx.font = `${active ? "600 " : ""}${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = isFirst ? "left" : isLast ? "right" : "center";
    ctx.textBaseline = "top";

    const anchorX = isFirst ? Math.max(0, x - radius) : isLast ? Math.min(width, x + radius) : x;
    const lines = wrapLabel(ctx, era.regionShort, labelWidth, 2);
    lines.forEach((line, li) => {
      ctx.fillText(line, anchorX, lineY + radius + 6 + li * lineHeight, labelWidth);
    });
  });
}

function drawVertical(ctx: CanvasRenderingContext2D, box: RegionBox, eras: RegionEra[], activeKey: string): void {
  const { width, height } = box;
  const padding = height * 0.12;
  const usableH = height - padding * 2;
  const lineX = width * 0.16;
  const step = eras.length > 1 ? usableH / (eras.length - 1) : 0;

  ctx.strokeStyle = "rgba(179, 85, 47, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lineX, padding);
  ctx.lineTo(lineX, height - padding);
  ctx.stroke();

  const fontSize = Math.max(10, Math.min(13, width * 0.035));
  const labelWidth = width - lineX - 22;

  eras.forEach((era, i) => {
    const y = padding + step * i;
    const active = era.key === activeKey;
    const radius = active ? 7 : 4.5;

    ctx.beginPath();
    ctx.fillStyle = active ? "#b3552f" : "rgba(36, 31, 26, 0.35)";
    ctx.arc(lineX, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = active ? "#241f1a" : "rgba(36, 31, 26, 0.55)";
    ctx.font = `${active ? "600 " : ""}${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const [line] = wrapLabel(ctx, era.regionShort, labelWidth, 1);
    ctx.fillText(line, lineX + radius + 10, y, labelWidth);
  });
}

export function drawRegionMap(
  ctx: CanvasRenderingContext2D,
  box: RegionBox,
  eras: RegionEra[],
  activeKey: string,
): void {
  const { width, height } = box;
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  if (width < height * 1.8) {
    drawVertical(ctx, box, eras, activeKey);
  } else {
    drawHorizontal(ctx, box, eras, activeKey);
  }

  ctx.restore();
}
