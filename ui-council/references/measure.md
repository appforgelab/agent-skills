# Measuring rhythm and alignment

Raters judge by eye, and the eye names patterns: an icon on one link but not
its sibling, two selection styles, a contrast failure. It does not compare
magnitudes. A gap a third larger than its neighbour, or two rows of links
that share no vertical line, has no name a rater would recognise. Telling
them apart means comparing a few pixels, which models can't do reliably. So
this class of defect gets past the panel every time, even while scores
go up.

The measurement pre-pass covers it. It turns each screenshot into labelled
measurements and findings. Those go to you, the orchestrator, and **never to
the raters**: their folder holds screenshots only, so their blindness is
kept by construction and no number can anchor them. You read the findings
next to theirs. Once the numbers exist, the call is easy; producing them is
the hard part.

The pass works on any screenshot: a web page, a desktop app, a phone
screen.

## What it measures

The script is [`scripts/measure.mjs`](../scripts/measure.mjs), Node 18 or
later with no dependencies.

1. It cuts the screenshot into blocks: on blank rows and columns, merging
   letters into words, and opening up cards and filled buttons against
   their own fill.
2. Each block is trimmed to its ink: the pixels that differ from the
   background behind it. Gaps are then what a viewer sees. Padding,
   minimum hit areas and line height inside the layout boxes drop out.
3. Inside each container (the screen, a card, a panel), it groups the blocks
   by cutting at the widest clear gap first. Columns such as a sidebar and
   its content, or the cells of a grid, keep their own rhythm.

It reports:

- **Uneven gaps:** a part whose gap above and gap below are neither equal
  nor clearly different. Equal means under 1.2× or under 3 units apart. A
  clear step, such as a group break, is 1.75× or more. Anything in between
  reads as a mistake. The same test runs on a container's top and bottom
  padding (**uneven padding**), and on the gaps between items in a row of
  three or more (**uneven row gaps**).
- **No shared guide:** two stacked rows of items, such as footer links or
  toolbar buttons, where no item's left edge, centre or right edge lines up
  with any item in the other row. Rows that are each centred on their own
  fail this.
- **Near miss:** an element and the one below it whose edges are off by
  more than 2 units but no more than 8. That is close enough to look
  intended and far enough to look wrong.
- **Off centre:** a part 2 to 8 units off centre in its container.
- **Steps to confirm:** clear steps up to 3×, listed so you can confirm each
  one is a deliberate group break. Wider steps are plainly deliberate.
- **Gaps:** every vertical gap.

Every centring and alignment pair is kept in `--json`, classed `flush`,
`aligned`, `near` or `off`; only the `near` band is a finding. All
thresholds are options; see `--help`.

## Scale

Units are layout units: CSS px, dp or pt. Pass the capture's pixel density
as `--scale`: 1 for a standard desktop capture, 2 for HiDPI or Retina, and
the device pixel ratio for a phone, usually 2 to 3. The capture tool
usually reports it; otherwise divide the shot's width in pixels by the
viewport's width in layout units. Without a scale, values are in screenshot
pixels and the thresholds in units are off.

## An element tree, if you have one

A tree is optional. The shot is cut into blocks either way, so a tree
never hides ink detail, such as a button's label sitting off centre inside
its fill. What the tree adds: real labels in place of the anonymous
"block N" names, the gap between the layout boxes next to each ink gap
(when those two differ, padding or hit-area chrome explains the
difference), and containers the pixels alone cannot see, such as an
invisible layout group. If the capture tool gives element rects for free,
save them as `<shot>.tree.json` and pass the file after the shot:

- a DOM probe on the web ([capture](capture.md#web));
- an accessibility snapshot from a device or desktop automation tool;
- any JSON or XML whose elements carry rects as `{x, y, width, height}`,
  `{left, top, right, bottom}` or `"[l,t][r,b]"`.

The script infers the scale from the tree's width. A tree in screenshot
pixels needs `--scale`. Never spend effort getting a tree: the screenshot
alone finds the same defects.

## Run it

For each shot, from the scratch folder:

```sh
node <this skill>/scripts/measure.mjs <shot>.png [<shot>.tree.json] \
  --scale N --json measure/<shot>.json --overlay measure/<shot>.png
```

Add `--ignore-top` and `--ignore-bottom`, in units, to skip system bars or
browser chrome captured in the shot. The `measure/` folder is created if
needed. The script prints the findings as
Markdown. `--overlay` draws each block's ink box, and each finding's gaps
and guides with their values. Look at the overlay for every shot with
findings: a misread, such as two elements merged into one block, shows at a
glance there. Drop the findings it explains.

## Read the findings

- Measured findings are facts about the render, not taste. Mark each one as
  a defect or as deliberate, such as a group break that is meant to look
  like one, and give the reason.
- Check each rater point about spacing or alignment against the numbers.
  If the numbers confirm it, it stands. If they contradict it, record it as
  "measured: not the case".
- Report a defect as the relationship and its values, for example "gap above
  `Not now` 26, below 44: 1.7×". Equal steps in code can render unequal once
  paddings and hit areas stack, so the numbers say what's wrong. Never
  prescribe a code value from them.
- After a change, re-run on the new shot and compare the same keys in
  `--json`: the recorded values say whether the relationship actually
  moved, even once it stops being a finding. A fix that overshot reads as
  a bigger `off`, not as silence. A pair that drifted flush to an edge, or
  apart past overlap, keeps its record too — so a missing key means the
  element itself is gone, not that the relationship changed.

## Limits

- It sees what differs from the background by more than the tolerance, 10
  per colour channel by default. A lower-contrast surface, such as a faint
  card on a nearly identical page, is invisible to it, and so are the gaps
  it groups. A shadow counts as ink, so it widens its card's box by its blur.
- Ink gaps around text depend on the glyphs: descenders and capitals move
  the ink edge by a unit or two. That is why differences under 3 units count
  as equal.
- Photos, illustrations and gradients behind content defeat the background
  estimate, and findings on them are noise.
- Vertical centring inside a component is left out, because font metrics
  dominate it.
