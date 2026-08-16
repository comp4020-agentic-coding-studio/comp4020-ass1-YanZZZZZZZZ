import { loadCharacterData, type CharacterData, type CharacterEntry } from "./characters";
import { drawGlyphImpression } from "./glyph-render";
import { drawRegionMap } from "./region-map";

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
  onPreview: (entry: CharacterEntry) => void,
  onPreviewEnd: () => void,
): void {
  const canHover = window.matchMedia("(hover: hover)").matches;
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
      btn.lang = "zh";
      btn.textContent = entry.char;
      btn.dataset.char = entry.char;
      btn.setAttribute("aria-label", `${entry.char} (${entry.pinyin})`);
      btn.addEventListener("click", () => onSelect(entry));
      btn.addEventListener("focus", () => onPreview(entry));
      btn.addEventListener("blur", onPreviewEnd);
      if (canHover) {
        btn.addEventListener("mouseenter", () => onPreview(entry));
        btn.addEventListener("mouseleave", onPreviewEnd);
      }
      row.appendChild(btn);
    }
    group.appendChild(row);
    container.appendChild(group);
  }
}

function fadeIn(canvas: HTMLCanvasElement): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  canvas.classList.remove("is-fade-in");
  void canvas.offsetWidth;
  canvas.classList.add("is-fade-in");
}

export function initApp(): void {
  const glyphCtx = ensureCanvas("glyph-canvas", "glyph-fallback");
  const regionCtx = ensureCanvas("region-canvas", "region-fallback");

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

  const draw = (entry: CharacterEntry) => {
    if (!data) return;
    const era = data.eras[Number(slider.value)] ?? data.eras[0];
    if (eraValue) eraValue.textContent = era.label;
    if (eraCaption) {
      eraCaption.textContent = `${era.period} · Carrier: ${era.carrier} · Region: ${era.region}`;
    }
    caption.textContent = `${entry.char} (${entry.pinyin}) — ${entry.note}`;

    if (glyphCtx) {
      const box = syncCanvasSize(glyphCtx);
      drawGlyphImpression(glyphCtx, box, entry.char, era);
    }

    if (regionCtx) {
      const box = syncCanvasSize(regionCtx);
      drawRegionMap(regionCtx, box, data.eras, era.key);
    }
  };

  const render = () => {
    if (!selected) return;
    setActiveChip(selected.char);
    draw(selected);
  };

  const selectChar = (entry: CharacterEntry) => {
    selected = entry;
    render();
    if (glyphCtx) fadeIn(glyphCtx.canvas);
  };

  const previewChar = (entry: CharacterEntry) => {
    setActiveChip(entry.char);
    draw(entry);
  };

  const endPreview = () => {
    render();
  };

  slider.addEventListener("input", render);

  loadCharacterData()
    .then((loaded) => {
      data = loaded;
      slider.max = String(loaded.eras.length - 1);
      slider.disabled = false;
      renderPicker(picker, loaded.characters, selectChar, previewChar, endPreview);
      const initial = loaded.characters[Math.floor(Math.random() * loaded.characters.length)];
      if (initial) selectChar(initial);
    })
    .catch(() => {
      caption.textContent = "Failed to load character data. Please refresh the page and try again.";
      picker.textContent = "Unable to load the character list.";
      slider.disabled = true;
    });
}
