import { loadCharacterData, type CharacterData, type CharacterEntry } from "./characters";
import { drawGlyphImpression } from "./glyph-render";

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

function syncCanvasSize(ctx: CanvasRenderingContext2D): { width: number; height: number } {
  const canvas = ctx.canvas;
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

function groupByCategory(characters: CharacterEntry[]): Map<string, CharacterEntry[]> {
  const groups = new Map<string, CharacterEntry[]>();
  for (const entry of characters) {
    const list = groups.get(entry.category) ?? [];
    list.push(entry);
    groups.set(entry.category, list);
  }
  return groups;
}

function renderPicker(
  container: HTMLElement,
  characters: CharacterEntry[],
  onSelect: (entry: CharacterEntry) => void,
): void {
  container.innerHTML = "";
  for (const [category, entries] of groupByCategory(characters)) {
    const group = document.createElement("div");
    group.className = "category-group";

    const label = document.createElement("p");
    label.className = "category-label";
    label.textContent = category;
    group.appendChild(label);

    const row = document.createElement("div");
    row.className = "chip-row";
    for (const entry of entries) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip char-chip";
      btn.textContent = entry.char;
      btn.dataset.char = entry.char;
      btn.setAttribute("aria-label", `${entry.char}（${entry.pinyin}）`);
      btn.addEventListener("click", () => onSelect(entry));
      row.appendChild(btn);
    }
    group.appendChild(row);
    container.appendChild(group);
  }
}

export function initApp(): void {
  const glyphCtx = ensureCanvas("glyph-canvas", "glyph-fallback");
  ensureCanvas("region-canvas", "region-fallback");

  const picker = document.getElementById("char-picker");
  const caption = document.getElementById("glyph-caption");
  const slider = document.getElementById("era-slider") as HTMLInputElement | null;
  const eraValue = document.getElementById("era-value");
  const eraCaption = document.getElementById("era-caption");

  if (!picker || !caption || !slider) return;

  let data: CharacterData | null = null;
  let selected: CharacterEntry | null = null;

  const setActiveChip = (char: string) => {
    picker.querySelectorAll<HTMLButtonElement>(".char-chip").forEach((btn) => {
      btn.setAttribute("aria-current", String(btn.dataset.char === char));
    });
  };

  const render = () => {
    if (!data || !selected) return;
    const era = data.eras[Number(slider.value)] ?? data.eras[0];
    if (eraValue) eraValue.textContent = era.label;
    if (eraCaption) {
      eraCaption.textContent = `${era.period} · 载体：${era.carrier} · 代表地区：${era.region}`;
    }
    caption.textContent = `${selected.char}（${selected.pinyin}）— ${selected.note}`;
    setActiveChip(selected.char);

    if (glyphCtx) {
      const box = syncCanvasSize(glyphCtx);
      drawGlyphImpression(glyphCtx, box, selected.char, era);
    }
  };

  const selectChar = (entry: CharacterEntry) => {
    selected = entry;
    render();
  };

  slider.addEventListener("input", render);

  loadCharacterData()
    .then((loaded) => {
      data = loaded;
      slider.max = String(loaded.eras.length - 1);
      slider.disabled = false;
      renderPicker(picker, loaded.characters, selectChar);
      const initial = loaded.characters[Math.floor(Math.random() * loaded.characters.length)];
      if (initial) selectChar(initial);
    })
    .catch(() => {
      caption.textContent = "汉字数据加载失败，请刷新页面重试。";
      picker.textContent = "无法加载汉字列表。";
      slider.disabled = true;
    });
}
