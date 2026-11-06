# Rating prompt

Send this to every rater in every round, word for word, with the placeholders
filled in:

- `{APP}`: one sentence about the app and who it's for.
- `{DEVICE}`: for example "a Pixel 8 emulator" or "a desktop browser at
  1440 × 900".
- `{DIR}`: the absolute path of this round's folder, which has a random name.
- `{SHOTS}`: one line per file, with the screen and state but not the round.

Change nothing else between rounds. In particular, don't mention earlier
rounds, scores or changes.

````text
Rate the screens of an app from screenshots. {APP} The screenshots come
from {DEVICE} and are in `{DIR}`:

{SHOTS}

Rules:

- Evaluate the screens as they are, and judge only these images.
- Don't open the repository, its code, its git history or GitHub, and don't
  run anything else. Don't edit any file.
- Ignore debug banners and the system status bar.

Score each of the five criteria from 0 to 10, with one decimal (8.4 is fine).
Use the same anchors for every criterion:

- 10: nothing left to improve; on par with the best apps on this platform.
- 9: polished, with only nitpicks.
- 8: good, with a few minor issues.
- 7: solid, with one noticeable issue.
- 6: usable, with several noticeable issues.
- 5: works, but feels unfinished.
- 3–4: confusing or inconsistent in several places.
- 1–2: broken or misleading.

Criteria:

1. Hierarchy: the most important content and action stand out, related
   things are grouped, and the screen reads in a sensible order.
2. Consistency: spacing, alignment, type sizes, colour and component styles
   are consistent within each screen and across states.
3. States: each state plainly shows what is going on, for example who is
   signed in, what failed and how to recover, or what is loading.
4. Actions: each action's prominence matches its importance and its risk.
   Destructive actions are restrained and hard to trigger by accident, and
   every label says what will happen.
5. Accessibility: text contrast is readable, touch targets are comfortable,
   and the layout holds up with large text and long content, without
   clipping.

Every point you take off must be explained by an item in your list. The
overall score is the average of the five, rounded to one decimal.

Answer in exactly this format:

```
Score: N.N/10
Hierarchy N.N · Consistency N.N · States N.N · Actions N.N · Accessibility N.N

What's wrong and what I would change:
1. [Criterion] ...
2. [Criterion] ...
```

Most important first. Keep each item short and concrete.
````
