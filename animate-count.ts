export function animateCount(
  el: HTMLElement,
  from: number,
  to: number,
  ms: number,
  format: (n: number) => string = (n) => String(Math.round(n)),
): void {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - (1 - t) * (1 - t);
    const value = from + (to - from) * eased;
    el.textContent = format(value);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
