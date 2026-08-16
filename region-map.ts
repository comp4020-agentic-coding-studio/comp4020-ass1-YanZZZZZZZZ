export interface RegionBox {
  width: number;
  height: number;
}

export interface RegionEra {
  key: string;
  region: string;
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

  const padding = Math.min(width, height) * 0.12;
  const usableW = width - padding * 2;
  const lineY = height * 0.5;
  const step = eras.length > 1 ? usableW / (eras.length - 1) : 0;

  ctx.strokeStyle = "rgba(179, 85, 47, 0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, lineY);
  ctx.lineTo(width - padding, lineY);
  ctx.stroke();

  const labelWidth = step > 0 ? step * 0.9 : width;
  const fontSize = Math.max(10, height * 0.06);

  eras.forEach((era, i) => {
    const x = padding + step * i;
    const active = era.key === activeKey;
    const radius = active ? 8 : 5;

    ctx.beginPath();
    ctx.fillStyle = active ? "#b3552f" : "rgba(36, 31, 26, 0.35)";
    ctx.arc(x, lineY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = active ? "#241f1a" : "rgba(36, 31, 26, 0.55)";
    ctx.font = `${active ? "600 " : ""}${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(era.region, x, lineY + radius + 6, labelWidth);
  });

  ctx.restore();
}
