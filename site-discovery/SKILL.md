---
name: site-discovery
description: >-
  Find the comparable websites worth learning from before a product site is
  designed: reads the repo, asks a short brief, searches the category and one
  adjacent industry, filters out template slop and stale listicles, and hands
  over an evidence-only candidates doc with verdicts, ending with the user
  picking three to five sites. Use whenever a marketing or product website is
  about to be built, rebuilt or improved and the research should come first —
  before mock-ups, before ui-design, before a line of the new site is written.
  Also use when the user asks for competitor or reference websites. Measuring
  the picks and proposing a direction is site-dissect's job, not this one.
metadata:
  harness: [claude, codex, opencode]
---

# Site Discovery

The research half of a website redesign: find who solves the same promise and
how they present it, so the design that follows is grounded in the category
instead of in templates. This skill collects evidence and stops at the
evidence: verdicts, not directions. `site-dissect` measures the picks and
proposes the design direction.

## Workflow

1. **Pre-fill the brief from the repo.** Read the site's code (or, for a site
   not yet built, the app's code), the app theme, any existing DESIGN.md and
   the README. Most of the brief is answerable from the repo; ask only what
   the repo cannot answer.
2. **Ask the brief in one round** — at most five questions, the anchor first:
   what is the one thing someone should remember after seeing the site for ten
   seconds? Offer options, but invite free-form answers; a user's own wording
   often restructures the whole anchor. Hold one spare round for follow-ups
   their answers raise; after that, work with what you have.
3. **Set the depth with the user.** Default `standard`. Any cell can be
   overridden by a number ("standard, but eight sites fetched"); record the
   chosen depth in the doc:

   | Depth | Searches | Sites fetched | Candidates offered |
   | --- | --- | --- | --- |
   | Scan | 2 | 2–3 | 4–6 |
   | Standard | 4 | 4–6 | 6–9 |
   | Deep | 6+ | 8+ | 10+ |

4. **Search the category, then outside it.** Run, in order:
   - Category incumbents: `best <category> apps <year>`.
   - Promise twins: the product's promise, phrased as a user would say it —
     sites answering the same promise are the closest design briefs that
     exist.
   - Cross-industry: `best <adjacent industry> product websites <year>` — one
     search outside the category, for structure worth importing.
   - Teardowns and audits, which name sites worth fetching.

   If a search returns nothing or pure slop, reword it once — different noun,
   the year in or out, "best" for "examples of" — then move on. Record every
   query that was run in the doc.
5. **Filter slop before fetching.** Skip as sources: undated listicles, SEO
   aggregators, template galleries posing as inspiration. Flag as suspect, as
   candidates: violet or purple default palettes, gradient-mesh or
   blurred-blob heroes, emoji feature icons, all-caps tracked eyebrow labels,
   badge walls, glassmorphism over photos. This list describes a moment and
   goes stale — re-check it against what is actually fetched rather than
   filtering mechanically, and remember a slop-looking site can still own a
   structure worth stealing; that is what the `mixed` verdict is for.
6. **Fetch and verdict, evidence only.** Fetch each promising candidate and
   write its verdict from what the fetch shows — structure, argument,
   positioning, honesty of the copy. Cite the evidence next to the verdict.
   When no visual capture happened, keep content-and-structure verdicts
   separate from visual ones; never pass a text verdict off as a visual one.
   Verdicts: strong keep, mixed, weak, unfetched.
7. **Write the candidates doc** into the project's docs folder: the brief
   (promise, what bothers the user, direction lean, motion, content scope),
   the searches run, a table of candidates with evidence and verdicts, and
   the current site — or, for a site not yet built, the closest stand-in — as
   the baseline row. End with a recommended core set.
8. **Gate: the user picks 3–5.** Recommend a core of three with reasons;
   contrast picks are allowed. The current site joins the dissection
   regardless of the picks. Then hand off to `site-dissect`.

## Degradation ladder

Work down the rungs as tools fail, and record in the doc which rung the run
landed on:

1. Search and fetch both work: the normal run.
2. No search available: ask the user to name candidates; still fetch and
   verdict.
3. A single fetch fails: snippet-only verdict, marked `unfetched` — evidence
   is never invented.
4. No fetch either: say the skill cannot run and ask the user for materials
   instead.

## Boundaries

- Evidence only. No directions, no keep/change/reject lists, no token
  proposals — synthesis belongs to `site-dissect`.
- Every verdict cites fetched evidence. A hunch is a question for the user,
  not a verdict.
