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
   round, each tied to a dimension below the target when there is one,
   otherwise to the lowest-scored dimensions. Express every value as a
   DESIGN.md token. A fix that needs a value the doc lacks is a doc proposal,
   not a one-off literal.
4. **Keep the app coherent.** When improving a subset of screens, include an
   untouched screen as the identity reference, and judge identity conformance
   against DESIGN.md, not against taste. Local beauty that breaks the system
   is a regression.

## With ui-council

Give the raters the [rating rubric](references/rating-rubric.md) and a fixed
token summary from DESIGN.md; keep everything else about the council
unchanged. ui-council only rates and suggests. When you improve between its
ratings:

- Use named moves only, at most three per round, as in step 3.
- Use tokens only: the theme code's tokens until a DESIGN.md exists.
- Propose doc changes for approval instead of applying them, and keep
  working meanwhile. Approved changes go into DESIGN.md with the work's
  commit; fixes that need them wait for the next run.
- When a DESIGN.md exists and the targets are part of a larger app, the
  same untouched screen joins every rating as the identity reference,
  never rated itself. Shared components may still change how it looks.
- Wording users will see stays with the user: propose it as a question.
