import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Assignment 1's own contract: a three-act interactive explainer, one canvas
// visualization and one interactive control per act. Runs against the BUILT
// site, same as the invariants, so it checks what actually ships.
const dist = resolve("dist", "index.html");
const doc = new JSDOM(readFileSync(dist, "utf8")).window.document;

describe("assignment: title reflects the topic", () => {
  it("mentions the stop-hunt premise", () => {
    expect(doc.title.toLowerCase()).toContain("stop");
  });
});

describe("assignment: three-act structure", () => {
  const actIds = ["act-1", "act-2", "act-3"];

  for (const id of actIds) {
    describe(`#${id}`, () => {
      const section = doc.getElementById(id);

      it("exists as a landmark section", () => {
        expect(section).toBeTruthy();
        expect(section?.tagName.toLowerCase()).toBe("section");
      });

      it("has a heading", () => {
        expect(section?.querySelector("h2, h3")).toBeTruthy();
      });

      it("has a canvas visualization", () => {
        expect(section?.querySelector("canvas")).toBeTruthy();
      });

      it("has a fallback for when canvas is unavailable", () => {
        const fallback = section?.querySelector("canvas + * , [id$='fallback']");
        expect(fallback).toBeTruthy();
      });

      it("has at least one interactive control", () => {
        const controls = section?.querySelectorAll("input, button") ?? [];
        expect(controls.length).toBeGreaterThan(0);
      });
    });
  }

  it("nav links point at all three acts", () => {
    const hrefs = [...doc.querySelectorAll("nav a")].map((a) => a.getAttribute("href"));
    for (const id of actIds) {
      expect(hrefs).toContain(`#${id}`);
    }
  });
});
