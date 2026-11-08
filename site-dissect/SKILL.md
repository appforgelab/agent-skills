---
name: site-dissect
description: >-
  Dissect comparable websites by measurement, not taste: derives the project's
  foundation from the app's theme code first, extracts computed styles — type
  scale, palette, section rhythm, page length — from each picked site and from
  the current one as the baseline, synthesizes conventions, trends and gaps
  into keep/change/reject lists, and proposes two or three anti-convergent
  design directions with a tiered, approval-gated DESIGN.md. Use after
  site-discovery has picked the candidates, or whenever the user names sites
  to learn from before a website is designed or redesigned. Implementing the
  direction belongs to ui-design; blind scoring to ui-council.
metadata:
  harness: [claude, codex, opencode]
---

# Site Dissect

The measurement half of a website redesign: what the category does (measured,
not remembered), what the project already owns, and the direction that fits
both. Where `site-discovery` collects candidates, this skill puts them under
the knife and ends with a direction the user approves.

## Workflow

1. **Start from the app, not the references.** Before measuring any outside
   site, read the project's own theme and token code — the app's theme files,
   CSS custom properties, Tailwind config, whatever holds values. The brand
   usually already exists; a website that contradicts it is drift, not
   identity. Derive foundation candidates (palette, type voice, shape) from
   the code and name the file they came from. Greenfield with no code to
   read: say so; the foundation then comes from the references plus the
   user's choice.
2. **Measure every pick and the baseline** ([capture](references/capture.md)):
   one browser tab, desktop viewport, computed styles per site; the current
   site in a mobile viewport too. The current site is always measured — it is
   the baseline to beat, not a reference to copy. Keep each site's raw JSON
   in scratch and distill it into the direction doc's measurement table, as
   measured values only: fonts at exact sizes and weights, hex backgrounds,
   rhythm ranges, page heights.
3. **Write per-site notes.** What each measured site argues, and how its
   values serve the argument — one short block per site, every claim tied to
   a number or a fetch.
4. **Synthesize in three layers.**
   - Conventions: what the whole category does — keep unless there is a
     reason not to; violating one costs trust.
   - Trends: what the fashionable sites do now — adopt knowingly; they date.
   - Gaps: positions nobody in the measured set owns — where identity lives.
5. **Write keep / change / reject.** Keep: already ours and already right.
   Change: ours and wrong. Reject: measured in the wild and named with values
   — hexes, sizes, patterns — so the avoid-list comes from data, not taste.
6. **Propose two or three anti-convergent directions.** They must differ in
   kind, not degree — not three shades of the same site. At most one safe.
   Cross-industry import is welcome: a structure or pattern from outside the
   category. Each direction names its palette lean, type lean, motion stance,
   structure, what it risks, and its slop-guard. Recommend one, with reasons;
   the user decides, and free-form answers are welcome — guardrails the user
   adds go in verbatim.
7. **Write the direction doc; propose DESIGN.md.** The direction doc (in the
   project's docs folder) records the brief, the measurement table, the
   per-site notes, the synthesis, keep/change/reject, the directions and
   their approval status. The DESIGN.md proposal follows ui-design's
   [design doc](../ui-design/references/design-doc.md) conventions, tiered:
   a `Foundation` section for what every surface shares, then one section per
   surface (for example App and Website). Surfaces extend the foundation,
   never contradict it; a foundation change is flagged as affecting every
   surface and is checked against each before approval. Nothing is written
   into DESIGN.md before the user approves a direction; values not yet
   settled stay `undecided`. Both files live with the project's other
   documentation — DESIGN.md beside the direction doc — and once approved,
   DESIGN.md is linked from the project's agent instructions, so it is found
   wherever it sits.
8. **Hand off.** `ui-design` implements against DESIGN.md. `ui-council` rates
   before and after — it needs a screenshot capture path; when none exists,
   defer that to build time and say so in the doc's open items.

## Rules

- **Copyright:** take measured values and patterns — scales, ratios, rhythms,
  roles — never images, copy, illustrations, icons or font files, and never a
  reference's exact type pairing; an identity is a pairing, so pair
  differently. Borrow the restraint, not the identity.
- **Honesty about evidence:** every synthesis claim cites a measurement or a
  fetch. What no capture could show — motion, hover states, mobile on
  third-party sites — is a named gap, never a guessed verdict.
- **The current site is dissected with the same knife** as the references,
  and its numbers sit in the same table.
