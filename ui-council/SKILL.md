---
name: ui-council
description: >-
  Have a panel of models rate screenshots of an app's screens, blind, add a
  measurement pass for the spacing and alignment the eye misses, and report
  scores, findings and suggested improvements. It rates and suggests only; it
  never changes the app. Use when the user asks for a UI council, or wants
  models to score or critique screens of a web, desktop, Android or iOS app.
  The user may give the platform, the screens and their states, the raters
  and the rubric.
metadata:
  harness: [claude, codex, opencode]
---

# UI Council

Fresh models rate screenshots of an app's screens, blind. A measurement
pre-pass, which only you see, checks the spacing rhythm and alignment that
raters can't judge by eye. You merge both into a report: the scores, what's
wrong and the suggested improvements. You never change the app's code,
design or content.

## Inputs

Use what the user gave. Ask for anything missing in one batch of questions,
and offer the defaults:

- **Platform:** `web`, `desktop`, `android` or `ios`; default from the
  project.
- **Screens and states:** for each screen, the states to capture, for example
  signed out, signed in, an error, or the largest text size. For a whole app
  or site, list its screens and states from the code and have the user
  confirm the list.
- **Raters:** sol and opus by default; any of sol, opus, glm or muse.
- **Rubric:** the default five criteria, or `ui-design`'s design rubric —
  seven dimensions with anchors, identity among them and scored against the
  project's `DESIGN.md` — when the user asks for it. With no `DESIGN.md`,
  Identity is scored N/O, and the report suggests creating one
  ([design doc](../ui-design/references/design-doc.md)). When a `DESIGN.md`
  exists and the rated screens are part of a larger app, add one more
  screen as the identity reference: the one the user names, otherwise one
  you pick and name in the report. It joins the shots and the prompt, and
  is not itself rated. This rubric scores States on what the shots show, so
  include error, empty and loading states when possible.
- **Constraints:** optional. Decisions already made, from the user, an
  issue or the project's docs.

## Rules

- **Rate and suggest; change nothing.** Never edit the app's code, design,
  content or docs, and never commit, push or open anything. Building and
  running the app to capture it is fine.
- **Raters see only the screens as they are now.** Every run uses the same
  prompt, word for word, and fresh raters. Never tell them anything about
  earlier ratings, scores or changes.
- **Raters get screenshots only.** Element trees, measurements and overlays
  are for you. Never put them in the raters' folder or prompt.
- **Decisions already made are constraints.** When raters push against one,
  record it as a question, not a suggestion.
- **Some calls stay with the user:** wording users see, product scope and
  anything about pricing. Turn those into questions.
- **Never do anything irreversible or outward to reach a state,** such as
  deleting an account, buying something or sending a message. Use a test
  account, because screenshots go to the raters' providers.

## How

1. **Prepare.** Gather the inputs. Read the project's agent instructions and
   the code of the target screens. Work out how to reach each state on a real
   build ([capture](references/capture.md)). If a state can't be reached,
   say so and ask; never fake it.
2. **Capture.** Build and run the current version and capture every state.
   Copy the shots, and nothing else, into a new folder with a random name.
3. **Measure.** Run the [measurement pre-pass](references/measure.md) on
   every shot, and check its overlays. It needs only the screenshots.
4. **Rate.** Find each rater with T3's `orchestrator_capabilities` (pass its
   name as `search`). Prefer the newest full model, with reasoning effort
   `high` where it's offered. Start every rater at once with T3's
   `delegate_task`, in `async` mode with a new `clientRequestId`. Use the
   prompt in [rating prompt](references/rating-prompt.md), filled in; with
   the `ui-design` rubric, swap that prompt's scoring block for
   [ui-design's rating rubric](../ui-design/references/rating-rubric.md) and
   fill in its token summary. Then
   collect the results as T3 directs, without polling. If an answer ignores
   the format, rerun that rater once.
5. **Triage.**
   - Merge points that several raters share.
   - Add the measured findings, each marked as a defect or as deliberate.
     Check raters' spacing and alignment points against the numbers
     ([measure](references/measure.md#read-the-findings)).
   - Turn clear defects that fit the constraints into suggested
     improvements, most important first, favouring shared and measured
     points. Each says what's wrong and what to change, not how to code it.
   - Turn the user's calls, and points that clash with constraints, into
     questions.
   - Drop points that are only taste, and note why.
6. **Report** ([report](references/report.md)), and restore any device
   settings you changed.

If `delegate_task` isn't available, say so and stop. Don't fake the ratings.
