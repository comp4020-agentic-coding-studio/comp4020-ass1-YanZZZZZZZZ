# Assignment 1 reflection

## What was the breakthrough that moved the work forward?

The breakthrough was learning that my agent's "done" was not the same as my
"done." Early on, the agent generated glyphs for older scripts by taking the
modern character and applying a rougher jitter effect — plausible at a glance,
but structurally identical to the simplified form at every era, which quietly
broke the whole premise of "watch the script evolve." I only caught this
because I stopped trusting a green `pnpm check` from the agent as proof the
feature worked and started screenshotting the rendered canvas at each era
myself.

The same pattern repeated with the region-map labels: the agent's type
checker and tests said nothing about `ctx.fillText`'s `maxWidth` silently
squishing text instead of wrapping it, and only looking at a real screenshot
at 390×844 revealed the labels were unreadable. Both times, the real fix was
replacing an approach that merely looked plausible with one that was actually
correct — hand-authored pictograph reconstructions and real word-wrapping —
not tuning the broken approach further.

The breakthrough wasn't a technical fix; it was realizing I had to become the
agent's eyes, because the agent couldn't see what it was rendering.

## What did this work change about who I want to be as a software developer?

It sharpened the line I draw between "the checks are green" and "the feature
is correct," especially when working with an agent. Automated checks catch
what they're built to catch — they said nothing about a glyph being the wrong
shape or a label being unreadable, because those are visual truths that no
type checker or unit test can assert. This project forced me to build a
verification loop outside the agent: screenshot the actual canvas, open the
mobile viewport, read the rendered output with my own eyes before accepting a
commit.

I want to keep that habit — treat a passing check as necessary, not
sufficient, and demand visual evidence from the agent before calling something
done. It also changed how I write prompts: now I ask the agent to show me the
rendered artifact, not just report that it passes.
