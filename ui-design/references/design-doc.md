# DESIGN.md

One file per project repo: the visual identity as tokens, and the source of
truth for raters, improvers and humans. It records decisions, not a component
library; code stays in code.

## Contents

- **Voice:** three to five words for the personality (calm, dense, playful)
  and one line for what the app is not.
- **Palette:** each colour by role and value — action, action content, surface
  tiers, text tiers, border, success, warning, error, info. Values in the
  project's terms: hex, or the theme token's name.
- **Type:** the families; the scale as roles (caption, body, title, display)
  with size, weight and line-height each.
- **Spacing:** the base unit; the inset per container level; gutters; the
  minimum touch target.
- **Shape & depth:** radius per level; when elevation or borders are used.
- **Motion:** durations and easing, and where motion belongs at all.
- **Component conventions:** the variants that recur — button tiers, list
  rows, inputs — one line each.

Keep it to what a new designer must be told. Where a section has no answer
yet, write "undecided" rather than inventing one.

## Bootstrap

An existing app gets its de facto system recorded; a new project chooses one.

**Existing app — derive it:**

1. Collect evidence: screenshots across the app, not only the screens to
   improve, and the theme code — styles, tokens, theme definitions.
2. Derive the de facto system: the values that repeat are the system. Count
   them; the modal gap is the spacing base, the recurring sizes are the scale.
3. Write the proposal as tables, and flag every inconsistency found — two
   primary blues, three card paddings — as a decision for the user.

**New project — choose it:**

1. Propose a starter identity: build on a platform system (Material, HIG) or
   a reference app the user names; otherwise default to a neutral palette
   with scarce accent, a four-role type scale, and an 8-point base.
2. Mark whatever is not yet settled "undecided" rather than inventing it.

**Either way:**

1. The user settles the flags. Record the choice, not the debate.
2. Save as `DESIGN.md` at the repo root, or where the project keeps such
   docs, and link it from the project's agent instructions if it has them.
3. On a new project, once the first real screens exist, re-derive from them
   and correct the doc: choices made before anything was built don't keep
   their seats automatically.

## Evolution

- Changes are proposals, never silent drift. A proposal names the token, the
  reason, and the ripple — "add `accent-strong`: hierarchy fixes need an
  emphasis step between action and text; used on buttons and active rows" —
  and needs the user's approval.
- Prefer reusing a token over adding one. A palette that only grows stops
  being a system.
- Git is the changelog; the file carries no history section.

## Use

- **Raters** get a token summary: the palette roles, the type roles, the base
  unit — a few lines distilled from the doc, never the whole file.
- **Improvers** express every fix in tokens. A needed value that no token
  covers triggers a proposal, not a literal.
- **Standalone redesigns** follow the doc the same way; when the user asks
  for a new look, that's a doc rewrite by proposal, then screens brought to
  it — never screens drifting one by one.
