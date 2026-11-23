# Report

## Page

Build one self-contained HTML page. Check it with T3's `html_preview`, then
show it with `html_render`, using the `contentHeight` from the preview. Save a
copy as `report.html` next to the shots and give the user its path.

The page has, in this order:

1. **Scores:** a table with one row per rater and one column per criterion,
   plus the overall score, and an "Average" row. Each cell holds one number.
2. **Suggested improvements:** the triaged list, most important first. Each
   item names the screen and state, the criterion, what's wrong and what to
   change, and its source: how many raters raised it, or measured.
3. **Measured:** one row per measured finding: the state, the relationship
   with its values, and your call, defect or deliberate, with the reason.
   Below the table, put the overlay of each state with a defect. Measured
   findings never change the scores.
4. **Screens:** each rated shot with a caption. Leave out the identity
   reference screen, when there is one: it is not rated.
5. **Not suggested:** each dropped point, with the reason (a decision,
   taste, out of scope, not shown in the evidence, or measured: not the
   case).
6. **Questions for you:** the calls left for the user.

Layout:

- Reference images by absolute file path. `html_preview` and `html_render`
  inline local images, so the page carries no base64.
- Show phone shots about 260 px wide, and wrap them on narrow screens. Show
  desktop shots at the page's width.
- Follow `html_render`'s rules: theme variables, no page background, no outer
  card.

## Reply

End with the scores, the suggested improvements and the questions as text,
so whoever asked can act on them without opening the page.
