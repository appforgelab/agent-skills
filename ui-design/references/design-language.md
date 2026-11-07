# Design language

Seven dimensions. Diagnose with the questions, score with the anchors, fix
with the moves. Moves are ordered: cheap and local first, structural last.
Never take a structural move to dodge a cheap one.

## Scoring

- Score 0 to 10, one decimal. The anchors describe 9, 6 and 3; anything at or
  below 2 is broken, not just bad.
- Every deduction cites something visible in the evidence. A score without a
  cited reason doesn't count.
- Score the six screen dimensions on what the evidence shows. What it can't
  show — pressed or hover states in a still, focus rings in a static shot —
  becomes a named gap, not a missing score; ask for the missing evidence
  instead of guessing. Identity alone can be N/O: without a DESIGN.md there
  is nothing to conform to.

## 1. Hierarchy

**Principle:** one element wins, and the eye travels in the order the content
matters.

Ask:

- Where does the eye land first, and is that the screen's job?
- Does anything compete with it: a second primary action, a loud illustration,
  a badge?
- Does each action's prominence match its importance and its risk? Destructive
  actions quiet, the primary action singular.

Anchors:

- **9:** one obvious focal point, a guided reading order, prominence tracks
  importance everywhere.
- **6:** the focal point is findable but weakened by one competitor;
  prominence mostly right.
- **3:** several elements compete, the eye wanders, or a destructive action
  shouts.

Moves:

1. Name the screen's single primary action; demote every other action to a
   secondary or text variant.
2. Mute the competitors: less colour, less size, less position privilege.
3. Group related things by proximity and separate groups with whitespace, so
   the structure reads before the details.
4. Give content a heading for the screen's job where it starts without one.

## 2. Typography

**Principle:** a short scale set once; levels separated by weight and size
steps, not by many sizes.

Ask:

- How many distinct sizes are on screen, and would four roles (caption, body,
  title, display) cover them?
- Do adjacent levels contrast in weight, not just in a few pixels?
- Is line-height right per role: tighter for titles, looser for body?
- Is body text a comfortable measure, roughly 45 to 75 characters a line?
- Is all caps decoration, or is it earning its shout?

Anchors:

- **9:** four or fewer sizes from one scale, deliberate weight steps,
  comfortable measure.
- **6:** five-ish sizes, or one arbitrary jump; headings and body barely
  differ.
- **3:** many unrelated sizes, arbitrary line-heights, caps doing a weight
  job badly.

Moves:

1. Cut the sizes to the scale's roles; no size without a role.
2. Widen the weight step between adjacent levels instead of adding a size.
3. Set line-height per role and stop sizing it ad hoc.
4. Constrain body text width to fix the measure.

## 3. Spacing

**Principle:** one base unit; every gap a multiple of it; edges align where
they should.

Ask:

- Do the gaps read as multiples of a base, 4 or 8 points?
- Do the same relationships repeat between similar elements: card padding,
  list gaps, section separation?
- Do the edges that should align, align?
- Is separation between groups visibly larger than spacing within a group?

Anchors:

- **9:** every gap a multiple of the base, the same inset at every level of
  the same kind, edges align.
- **6:** mostly systematic with a few odd gaps or one misaligned edge.
- **3:** arbitrary gaps, padding varies per screen, nothing aligns.

Moves:

1. Pick the base unit and snap every spacing value to a multiple of it.
2. Define the inset per container level (screen, section, card) and apply one
   per level.
3. Double the gap between groups; keep single spacing within them.
4. Align the elements that share an edge, or deliberately detach them.

## 4. Colour

**Principle:** colour carries meaning, and accent is scarce and spent on
action.

Ask:

- How many accent colours compete for attention?
- Does body text pass contrast on its background, about 4.5:1, and large text
  about 3:1?
- Are the semantic colours held to their meanings: error red only for errors?
- Does anything rely on colour alone to carry its meaning?
- Is dark mode a considered mapping of the same roles, not an inversion?

Anchors:

- **9:** scarce accent, semantic roles kept, all text comfortably readable.
- **6:** readable, but accent overused or one semantic colour misapplied.
- **3:** contrast failures, several accents competing, or meaning that dies
  without colour.

Moves:

1. Reduce accent to the primary action family; let everything else recede.
2. Assign each colour a role from DESIGN.md and purge the ones without one.
3. Fix contrast by stepping to the stronger text tier, not by recolouring.
4. Pair colour-coded meaning with an icon or a word.

## 5. States

**Principle:** every interactive thing looks interactive, and every state says
what is going on.

Ask:

- Can you tell what's tappable, and do pressed, hover and focus read?
- Are loading, empty and error designed states, not blanks or tracebacks?
- Do disabled actions look disabled but not invisible?
- Are touch targets comfortable, about 44 to 48 points, and is keyboard focus
  visible?

Anchors:

- **9:** all states designed and unmistakable.
- **6:** the happy path is fine; edge states are blank, cryptic or blaming.
- **3:** can't tell what's interactive, or errors leave the user stuck.

Moves:

1. Design the missing states: empty, loading, error, each saying what
   happened and what to do next.
2. Give interactive elements one consistent affordance: tint, elevation or
   underline, used everywhere.
3. Make focus visible and targets meet the minimum size.
4. Rewrite errors as recovery: what happened, what to do.

## 6. Layout

**Principle:** whitespace is a material, and density matches the task.

Ask:

- Does the screen breathe, or is it a wall?
- Do the regions — header, content, footer, navigation — hold across sibling
  screens?
- Does the layout survive large text and narrow viewports without clipping?
- Is the density right for the job: air for reading, compactness for
  operating?

Anchors:

- **9:** deliberate whitespace, stable regions across screens, survives large
  text.
- **6:** slightly cramped, or one region shifts between sibling screens.
- **3:** a wall of content, clipping at large text, layout improvised per
  screen.

Moves:

1. Add breathing room at group boundaries first; it's the cheapest whitespace.
2. Stabilize the regions across screens: same header height, same navigation.
3. Fix clipping at large text before any polish.
4. Shed content per view on narrow viewports instead of shrinking everything.

## 7. Identity

Score this dimension only when a DESIGN.md exists; otherwise N/O.

**Principle:** coherence beats local beauty; every value traceable to a token.

Ask:

- Which values on this screen are not tokens: sizes, gaps, colours, radii?
- Would this screen sit beside the app's other screens as one app?
- Do the same constructs — headers, lists, buttons — take the same patterns as
  on the app's other screens?

Anchors:

- **9:** everything traceable; sits naturally beside the app's other
  screens.
- **6:** one or two off-token values.
- **3:** reads like a different app.

Moves:

1. Replace off-token values with the nearest token.
2. If the nearest token is wrong, propose a DESIGN.md change rather than
   working around it.
3. Align recurring constructs with the patterns on the app's other screens.
