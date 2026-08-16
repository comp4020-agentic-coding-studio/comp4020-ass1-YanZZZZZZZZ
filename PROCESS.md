# Process overview

A reading-guide to how the work came together --- a map to your process, not an
essay about it. Markers read this file and follow its citations; they don't
trawl the repo for evidence you didn't point at, so if a moment mattered, cite
it.

## What I built

**Hanzi Flow** (汉字流动): a single-page interactive that lets a user pick one
of thirty Chinese characters and drag a timeline slider through six historical
script eras (甲骨文 → 金文 → 篆书 → 隶书 → 楷书 → 简化字). The character's glyph
rendering and its associated region update together, so the same character
keeps resurfacing in a different age with each drag. This replaced an earlier
stop-hunt market-simulator prototype for the same repo, retired mid-week
because the underlying mechanic wasn't teaching anything the user found
compelling to build further.

## The moments that mattered

1. **The pivot away from stop-hunt.** The original market-simulator concept
   wasn't working as a teaching tool, so rather than iterate on it further I
   retired the topic outright and rewrote the project charter in `CLAUDE.md`
   to record the new one --- Hanzi Flow --- as a harness-level decision, not a
   one-off prompt: the honesty constraints (glyphs are stylized
   reconstructions, regions are one representative place per era, not
   per-character findspots) were written into `CLAUDE.md` itself so every
   later feature had to satisfy them by construction, rather than being
   checked after the fact.
   ([`0740205`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YanZZZZZZZZ/commit/0740205))

2. **Font-jitter glyphs weren't the old scripts, just blurry modern ones.**
   The first glyph renderer took the *modern* Unicode character and applied a
   seeded stroke-jitter effect that got rougher for older eras --- which
   produced a plausible-looking scratchy glyph, but one that was structurally
   identical to the simplified character at every era, not the actual
   pictographic form those scripts used. Instead of tuning the jitter further,
   I hand-authored a set of vector line reconstructions (`pictographs.ts`) of
   the well-documented early pictographic forms for all thirty characters, and
   split the renderer so oracle/bronze/seal eras draw those reconstructed
   strokes with era-appropriate stroke treatment (thin angular jitter → thick
   rounded joints → smooth elongated curves) while clerical/regular/simplified
   eras --- where the real Unicode glyph is historically close --- still use
   `fillText`. I verified the change with a Playwright screenshot of the same
   character (山) across all three pictograph eras and confirmed the shapes
   are now visibly distinct, not just noisier versions of one shape.
   ([`5e5e787`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YanZZZZZZZZ/commit/5e5e787))

3. **The header read as flat and generic, so I paired fonts on purpose rather
   than picking defaults.** Feedback on the first layout was that the
   background and title felt rigid. Rather than reach for an arbitrary
   display font, I picked a pairing with a thematic argument behind it: Ma
   Shan Zheng (a brush-calligraphy style) for the Chinese title, and Cinzel
   (a classical carved-inscription serif) for the English "HANZI FLOW"
   kicker --- ink brushed next to stone carved, which is the same
   rough-to-clean arc the glyph timeline itself depicts. This surfaced one
   real correction: `stylelint`'s `font-family-name-quotes` rule failed on
   `"Cinzel"` because single-word font names must be unquoted while
   multi-word ones stay quoted --- caught by `pnpm check`, not by eye.
   ([`9d320e3...dab72d2`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YanZZZZZZZZ/compare/9d320e3...dab72d2))

4. **A reported bug traced to a canvas API footgun, not a layout tweak.** The
   bottom row of the region map was cutting off labels like "Xianyang,
   Shaanxi" and "Mainland China". The obvious fix would have been to shrink
   the font or widen the canvas, but reading `region-map.ts` showed the real
   cause was `ctx.fillText(text, x, y, maxWidth)` --- the `maxWidth` argument
   silently *squishes* text horizontally to fit rather than wrapping it, so
   long labels were being compressed into illegibility rather than clipped.
   I replaced it with genuine `measureText`-based word-wrapping and, after a
   first screenshot pass still showed six items colliding on a narrow mobile
   width, added a responsive horizontal/vertical layout switch. I confirmed
   the fix with Playwright screenshots of the live map at both 1920×1080 and
   390×844 before committing, rather than trusting `pnpm check` alone --- the
   bug was a rendering behavior a type check or unit test wouldn't have
   caught.
   ([`ba87754`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-YanZZZZZZZZ/commit/ba87754))

## Before you ship

`pnpm check:evidence` verifies your citations resolve to real commits, that the
current reflection entry is in `reflections/`, and that your `CLAUDE.md` is
there --- before a marker ever opens the file. It checks that your map is
traceable, not that it is good: the marker judges whether your small,
deliberately chosen set of moments shows real judgement and reflection. A green
check is not a substitute for that curation.
