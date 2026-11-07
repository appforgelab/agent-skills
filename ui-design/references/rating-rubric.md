# Rating rubric

For a ui-council run with this rubric, take ui-council's rating prompt (at
`../../ui-council/references/rating-prompt.md`, next to this skill) and swap
its scoring block — from "Score each of the five criteria" through "Most
important first. Keep each item short and concrete." — for the block below.
Keep the rest word for word: the rules, the blindness, the same prompt every
round. The anchors below are the rater-facing digest of
[the design language](design-language.md), which stays authoritative.
Placeholders:

- `{TOKENS}`: a few lines distilled from DESIGN.md — the palette roles, the
  type roles, the base unit. Raters never get the whole doc. With no DESIGN.md
  yet — the user declined the bootstrap — fill it with "none: this app has no
  design doc yet", and raters score Identity N/O.
- `{REFERENCE}`: the reference screen's name, when the screens to improve
  are part of a larger app and one untouched screen joins the shots as the
  identity baseline — chosen before round 0, the same every round, never a
  target, not itself rated. Otherwise drop that paragraph.

````text
Score each of the seven dimensions from 0 to 10, with one decimal (8.4 is
fine). Anchors per dimension at 9, 6 and 3; at 2 or below the dimension is
broken, not just bad:

1. Hierarchy — 9: one obvious focal point, guided reading order, prominence
   tracks importance. 6: focal point findable but weakened by one competitor.
   3: several elements compete, the eye wanders, or a destructive action
   shouts.
2. Typography — 9: four or fewer sizes from one scale, deliberate weight
   steps, comfortable line length. 6: five-ish sizes, or one arbitrary jump;
   headings and body barely differ. 3: many unrelated sizes, arbitrary
   line-heights.
3. Spacing — 9: every gap a multiple of a base unit, consistent insets,
   shared edges align. 6: mostly systematic with a few odd gaps. 3:
   arbitrary gaps, padding varies per screen, nothing aligns.
4. Colour — 9: scarce accent, semantic roles kept, all text comfortably
   readable. 6: accent overused, or one semantic colour misapplied. 3:
   contrast failures, or several accents competing.
5. States — 9: every state designed and unmistakable. 6: happy path fine;
   edge states blank, cryptic or blaming. 3: can't tell what's interactive,
   or errors leave the user stuck.
6. Layout — 9: deliberate whitespace, stable regions across screens,
   survives large text. 6: slightly cramped, or one region shifts between
   screens. 3: a wall of content, clipping at large text.
7. Identity — 9: every value traceable to the token summary below, and,
   if a reference screen is given, the screen sits beside it as one app. 6:
   one or two off-token values. 3: reads like a different app.

Score the six screen dimensions on what the images show; what they cannot
show — pressed or hover states, focus rings — becomes an item in your list,
not a missing score. Identity alone may be "N/O": when no token summary is
given, score it N/O and leave it out of your average. Every point you take
off must be explained by an item in your list. The overall score is the
average of the scored dimensions, rounded to one decimal.

The app's visual identity, from its design doc:

{TOKENS}

The reference screen "{REFERENCE}", if listed in the shots, sets the app's
identity: judge Identity against it and the summary above. It is a baseline,
not one of the screens to rate.

Answer in exactly this format (Identity may be N/O when there is no token
summary):

```
Score: N.N/10
Hierarchy N.N · Typography N.N · Spacing N.N · Colour N.N · States N.N · Layout N.N · Identity N.N

What's wrong and what I would change:
1. [Dimension] ...
2. [Dimension] ...
```

Most important first. Keep each item short and concrete.
````
