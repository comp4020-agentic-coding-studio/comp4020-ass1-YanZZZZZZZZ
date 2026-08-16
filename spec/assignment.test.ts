import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Contract for the Hanzi Flow prototype: pick a character, drag the era
// slider, and watch the glyph + region update together. The character grid
// itself is rendered at runtime from characters.json (not present in the
// static build), so this checks the landmark and its wiring points rather
// than the generated buttons.
const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("hanzi-flow contract", () => {
  it("titles the page for the hanzi-flow topic", () => {
    expect(doc.title).toMatch(/Hanzi/i);
  });

  it("navigates to the character picker and the about section", () => {
    const hrefs = [...doc.querySelectorAll("nav a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("#char-picker");
    expect(hrefs).toContain("#about");
  });

  it("has a character-picker landmark", () => {
    const picker = doc.querySelector("#char-picker");
    expect(picker).toBeTruthy();
    expect(picker?.getAttribute("role")).toBe("group");
  });

  it("has a glyph stage with a canvas and a fallback", () => {
    const canvas = doc.querySelector("#glyph-canvas");
    const fallback = doc.querySelector("#glyph-fallback");
    expect(canvas).toBeTruthy();
    expect(fallback).toBeTruthy();
    expect(fallback?.hasAttribute("hidden")).toBe(true);
  });

  it("has an era timeline slider", () => {
    const slider = doc.querySelector("#era-slider");
    expect(slider).toBeTruthy();
    expect(slider?.getAttribute("type")).toBe("range");
  });

  it("has a region map with a canvas and a fallback", () => {
    const canvas = doc.querySelector("#region-canvas");
    const fallback = doc.querySelector("#region-fallback");
    expect(canvas).toBeTruthy();
    expect(fallback).toBeTruthy();
    expect(fallback?.hasAttribute("hidden")).toBe(true);
  });

  it("discloses that glyphs are stylized, not authentic scans", () => {
    const footer = doc.querySelector("#about");
    expect(footer?.textContent).toMatch(/stylized/i);
  });
});
