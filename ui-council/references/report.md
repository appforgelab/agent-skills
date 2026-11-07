# Report

## Page

Build one self-contained HTML page. Check it with T3's `html_preview`, then
show it with `html_render`, using the `contentHeight` from the preview. Save a
copy as `report.html` next to the round folders and give the user its path.

The page has, in this order:

1. **Scores:** a table with one row per round (round 0 is "Before") and one
   column per rater, plus an "Average" column. Each cell holds one number.
2. **Before and after:** for each state, the round 0 shot and the final shot
   side by side, each with a caption. Leave out the identity reference
   screen, when there is one: it is not a target.
3. **What changed:** short bullets for each round.
4. **Not acted on:** each skipped point, with the reason (a decision, taste,
   out of scope, not shown in the evidence, or the move cap).
5. **Questions for you:** the calls left for the user.

Layout:

- Reference images by absolute file path. `html_preview` and `html_render`
  inline local images, so the page carries no base64.
- Show phone shots about 260 px wide, so a pair fits side by side. Wrap the
  pairs on narrow screens.
- Follow `html_render`'s rules: theme variables, no page background, no outer
  card.

## Issue comment

When there is an issue, post a comment on it with:

- the scores table;
- what changed in each round;
- the points not acted on;
- the questions;
- a link to the PR, if there is one.

GitHub can't show local files, so leave the images out and say the full report
was shown in the session.
