function ensureCanvas(canvasId: string, fallbackId: string): CanvasRenderingContext2D | null {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  const fallback = document.getElementById(fallbackId);
  if (!canvas) return null;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    fallback?.removeAttribute("hidden");
    canvas.hidden = true;
    return null;
  }
  return ctx;
}

export function initApp(): void {
  ensureCanvas("glyph-canvas", "glyph-fallback");
  ensureCanvas("region-canvas", "region-fallback");
}
