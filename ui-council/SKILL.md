---
name: ui-council
description: >-
  Have a panel of models rate screenshots of an app's screens, blind, then
  improve the UI in rounds until a round limit or target score is reached, and
  report before and after. Use when the user asks for a UI council, or wants
  models to score, critique or improve screens of an Android, iOS or web app.
  The user may give the platform, the screens and their states, the raters,
  the number of rounds or a target score, or ask for rating only.
metadata:
  harness: [claude, codex, opencode]
---

# UI Council

Fresh models rate screenshots of the screens you're improving, without
knowing what changed. Between rounds you improve the UI. At the end, show the
scores and the screens before and after.

## Inputs

Use what the user gave. Ask for anything missing in one batch of questions,
and offer the defaults:

- **Platform:** `android` (default), `ios` or `web`.
- **Screens and states:** for each screen, the states to capture, for example
  signed out, signed in, an error, or the largest text size. For a whole app
  or site, list its screens and states from the code and have the user
  confirm the list.
- **Raters:** sol and opus by default; any of sol, opus, glm or muse.
- **When to stop:** a number of improvement rounds (default 1), or a target
  average score such as 9.0 with a round limit (default 3).
- **Mode:** improve (default), or rate only.
- **Rubric:** the default five criteria, or `ui-design`'s design rubric —
  seven dimensions with anchors, plus identity against the project's
  `DESIGN.md` — when the user asks for it. No `DESIGN.md` yet: bootstrap it
  with the user before round 0.
- **Issue:** optional. Its decisions are constraints, and the report goes
  there.

## Rules

- **Keep rounds comparable.** Every round uses the same device or viewport,
  the same states and file names, the same prompt, and fresh raters. Never
  tell raters what changed or which round it is.
- **Decisions the user made are constraints.** They come from the issue, the
  conversation or the project's docs. When raters push against one, record
  it as a question and don't act on it. Don't chase the score.
- **Some calls stay with the user:** wording users see, product scope and
  anything about pricing. Collect them as questions for the end, and keep
  working on the rest.
- **Never do anything irreversible or outward to reach a state,** such as
  deleting an account, buying something or sending a message. Use a test
  account, because screenshots go to the raters' providers.
- **Follow the project's rules** for branches, checks, tests and PRs. Asking
  for this skill authorizes a branch, commits, an issue and a PR.

## How

1. **Prepare.** Gather the inputs. Read the project's agent instructions and
   the code of the target screens. Work out how to reach each state on a real
   build ([capture](references/capture.md)). If a state can't be reached,
   say so and ask; never fake it.
2. **Capture round 0.** Build the current version and capture every state.
   Copy the shots into a new folder with a random name.
3. **Rate.** Find each rater with T3's `orchestrator_capabilities` (pass its
   name as `search`). Prefer the newest full model, with reasoning effort
   `xhigh` where it's offered. Start every rater at once with T3's
   `delegate_task`, in `async` mode with a new `clientRequestId`. Use the
   prompt in [rating prompt](references/rating-prompt.md), filled in; with
   the `ui-design` rubric, swap that prompt's scoring block for ui-design's
   rating rubric and fill in its token summary. Then
   collect the results as T3 directs, without polling. If an answer ignores
   the format, rerun that rater once.
4. **Check whether to stop.**
   - Rate-only mode stops after round 0.
   - Otherwise stop when the rounds are done or the average reaches the
     target.
   - Also stop early if two rounds in a row raise the average by less than
     0.3 and only taste or points that clash with decisions are left.
5. **Triage.**
   - Merge points that several raters share.
   - Act on clear improvements that fit the constraints, favouring shared
     points.
   - Turn the user's calls into questions.
   - Drop points that are only taste, and note why.
6. **Improve.** Make the round's changes, kept small. Run the project's checks
   and the tests that cover these screens. Build, capture the same states,
   and go back to step 3 with fresh raters.
7. **Finish** ([report](references/report.md)):
   - If anything changed, commit. If no issue was given, open one that
     records what was done and why. Then open a PR that refers to the issue.
     A run with no changes, such as rate only, skips this step.
   - Show the report page: the scores, each state before and after, the
     changes made in each round, and the questions.
   - Post the scores, the changes and the questions as a comment on the
     issue.
   - Restore any device settings you changed.

If `delegate_task` isn't available, say so and stop. Don't fake the ratings.
