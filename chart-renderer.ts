import type { Candle } from "./candles";

export interface PriceLine {
  price: number;
  color: string;
  label?: string;
  draggable: boolean;
  dashed?: boolean;
}

type DragListener = (price: number) => void;

const PADDING_Y = 24;
const PADDING_X = 8;

export class ChartRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private candles: Candle[] = [];
  private visibleCount = 20;
  private fixedDomain: [number, number] | null = null;
  private lines = new Map<string, PriceLine>();
  private dragListeners = new Map<string, DragListener>();
  private draggingId: string | null = null;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.attachPointerHandlers();
  }

  setCandles(candles: Candle[]): void {
    this.candles = candles;
  }

  setVisibleCount(n: number): void {
    this.visibleCount = n;
  }

  setFixedDomain(min: number, max: number): void {
    this.fixedDomain = [min, max];
  }

  setLine(id: string, line: PriceLine): void {
    this.lines.set(id, line);
  }

  removeLine(id: string): void {
    this.lines.delete(id);
    this.dragListeners.delete(id);
  }

  onLineDrag(id: string, listener: DragListener): void {
    this.dragListeners.set(id, listener);
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private get width(): number {
    return this.canvas.width / this.dpr;
  }

  private get height(): number {
    return this.canvas.height / this.dpr;
  }

  private domain(): [number, number] {
    if (this.fixedDomain) return this.fixedDomain;
    const visible = this.candles.slice(-this.visibleCount);
    if (visible.length === 0) return [0, 1];
    let min = Infinity;
    let max = -Infinity;
    for (const c of visible) {
      min = Math.min(min, c.low);
      max = Math.max(max, c.high);
    }
    for (const line of this.lines.values()) {
      min = Math.min(min, line.price);
      max = Math.max(max, line.price);
    }
    const pad = (max - min) * 0.1 || 1;
    return [min - pad, max + pad];
  }

  priceToY(price: number): number {
    const [min, max] = this.domain();
    const usable = this.height - PADDING_Y * 2;
    const t = (price - min) / (max - min || 1);
    return PADDING_Y + usable * (1 - t);
  }

  yToPrice(y: number): number {
    const [min, max] = this.domain();
    const usable = this.height - PADDING_Y * 2;
    const t = 1 - (y - PADDING_Y) / usable;
    return min + t * (max - min);
  }

  private attachPointerHandlers(): void {
    this.canvas.addEventListener("pointerdown", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const y = event.clientY - rect.top;
      let closestId: string | null = null;
      let closestDist = 12;
      for (const [id, line] of this.lines) {
        if (!line.draggable) continue;
        const lineY = this.priceToY(line.price);
        const dist = Math.abs(lineY - y);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      }
      if (closestId) {
        this.draggingId = closestId;
        this.canvas.setPointerCapture(event.pointerId);
      }
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.draggingId) return;
      const rect = this.canvas.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const price = this.yToPrice(y);
      const line = this.lines.get(this.draggingId);
      if (!line) return;
      line.price = price;
      this.dragListeners.get(this.draggingId)?.(price);
      this.draw();
    });

    const release = () => {
      this.draggingId = null;
    };
    this.canvas.addEventListener("pointerup", release);
    this.canvas.addEventListener("pointercancel", release);
  }

  draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const visible = this.candles.slice(-this.visibleCount);
    if (visible.length === 0) return;

    const slotWidth = (this.width - PADDING_X * 2) / visible.length;
    const bodyWidth = Math.max(2, slotWidth * 0.6);

    visible.forEach((candle, i) => {
      const x = PADDING_X + slotWidth * i + slotWidth / 2;
      const up = candle.close >= candle.open;
      ctx.strokeStyle = up ? "#3fb950" : "#f85149";
      ctx.fillStyle = up ? "#3fb950" : "#f85149";

      ctx.beginPath();
      ctx.moveTo(x, this.priceToY(candle.high));
      ctx.lineTo(x, this.priceToY(candle.low));
      ctx.lineWidth = 1;
      ctx.stroke();

      const openY = this.priceToY(candle.open);
      const closeY = this.priceToY(candle.close);
      const top = Math.min(openY, closeY);
      const h = Math.max(1, Math.abs(closeY - openY));
      ctx.fillRect(x - bodyWidth / 2, top, bodyWidth, h);
    });

    for (const line of this.lines.values()) {
      const y = this.priceToY(line.price);
      ctx.save();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.draggable ? 2 : 1.5;
      if (line.dashed) ctx.setLineDash([6, 4]);
      if (line.draggable) {
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
      ctx.restore();

      if (line.label) {
        ctx.fillStyle = line.color;
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText(line.label, this.width - 8 - ctx.measureText(line.label).width, y - 6);
      }
    }
  }
}
