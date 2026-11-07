---
name: ui-design
description: >-
  The designer's rubric and move playbook for app UI: seven dimensions with
  anchors (hierarchy, typography, spacing, colour, states, layout, identity),
  a DESIGN.md convention that keeps screens coherent across the app, and
  token-constrained improvement moves. Use alone to diagnose and redesign
  screens, with ui-council as its rating rubric and improver discipline, or
  to bootstrap a repo's DESIGN.md — derived from an existing app or chosen
  for a new one.
metadata:
  harness: [claude, codex, opencode]
---

# UI Design

A design language for agents: name what's wrong by dimension, fix it with a
named move, and keep every screen inside one visual identity. Where
`ui-council` measures, this skill decides what good means and which fixes are
allowed.

## The three pieces

1. **[Design language](references/design-language.md):** seven dimensions,
   each with a principle, diagnostic questions, anchored scores and named
   moves. Diagnosis and improvement both speak it.
2. **[DESIGN.md](references/design-doc.md):** the project's visual identity as
   tokens, derived from the app, confirmed by the user, changed only by
   explicit proposal. One per project repo; the source of truth for values.
3. **[Rating rubric](references/rating-rubric.md):** the dimensions as an
   anchored scoring sheet that drops into ui-council's rating prompt in place
   of its default criteria.

## Workflow

1. **Ensure DESIGN.md exists.** If the repo has none, bootstrap it first
   ([design doc](references/design-doc.md)). For an existing app, derive the
   de facto system from the screens and the theme code and have the user
   settle the inconsistencies — don't invent an identity, make the existing
   one explicit. For a new project, propose a starter identity and let the
   user choose.
2. **Diagnose before changing.** Score the dimensions per screen
   ([design language](references/design-language.md)), each score citing what
   the evidence shows. What the evidence can't show — pressed or hover
   states in a still — becomes a named gap, never a guessed score. Identity
   alone can be N/O, when no DESIGN.md exists.
3. **Improve with named moves** from the design language, at most three per
   round, each tied to a dimension scored low. Express every value as a
   DESIGN.md token. A fix that needs a value the doc lacks is a doc proposal,
   not a one-off literal.
4. **Keep the app coherent.** When improving a subset of screens, include an
   untouched screen as the identity reference, and judge identity conformance
   against DESIGN.md, not against taste. Local beauty that breaks the system
   is a regression.

## With ui-council

Give the raters the [rating rubric](references/rating-rubric.md) and a token
summary from DESIGN.md; keep everything else about the council unchanged —
blind raters, the same states, the same prompt every round. The token summary
stays fixed for the whole run; doc changes approved mid-run land after it.
Between rounds, act as the constrained improver: named moves only, at most
three per round, each tied to a dimension scored low; tokens only; doc
changes proposed for approval rather than applied. When the targets are part
of a larger app, one untouched screen joins every round's shots — the same
one from round 0 on — as the identity reference: never a target, and not
itself rated. Untouched means not a target; fixes to shared components may
change how it looks, and that is fine.
