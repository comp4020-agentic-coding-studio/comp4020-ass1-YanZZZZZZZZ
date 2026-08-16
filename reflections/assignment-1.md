# Assignment 1 reflection

## What was the breakthrough that moved the work forward?

The breakthrough wasn't a fix, it was noticing a fix that looked done wasn't.
Early on, the character glyphs for older scripts were just the modern
character redrawn with a rougher jitter effect — plausible at a glance, but
structurally identical to the simplified form at every era, which quietly
broke the whole premise of "watch the script evolve." I only caught this
because I stopped trusting a green `pnpm check` as proof the feature worked
and started actually screenshotting the rendered canvas at each era. The same
pattern repeated with the region-map labels: the type checker and tests had
nothing to say about `ctx.fillText`'s `maxWidth` silently squishing text
instead of wrapping it, and only looking at a real screenshot at 390×844
revealed the labels were unreadable. Both times, the real fix was replacing an
approach that merely looked plausible with one that was actually correct
(hand-authored pictograph reconstructions; real word-wrapping), not tuning the
broken approach further.

## What did this work change about who I want to be as a software developer?

It sharpened the line I draw between "the checks are green" and "the feature
is correct." Automated checks catch what they're built to catch — they said
nothing about a glyph being the wrong shape or a label being unreadable. I
want to keep the habit this project forced on me: treat a passing check as
necessary, not sufficient, and go look at the actual rendered artefact before
calling something done.
