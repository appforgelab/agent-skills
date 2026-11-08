# agent-skills

A skill is a folder of instructions that teaches a coding agent one workflow,
such as merging Dependabot PRs or running a review loop. The agent loads a
skill when your request matches the skill's description, or when you call the
skill by name. The skills here are written to work the same in every agent
CLI: Claude Code, Codex and OpenCode, and so in T3 Code, which runs those
CLIs.

## Skills

Call a skill by name, for example `/pr-review-loop opus` in Claude Code, or
describe the task in plain words. The review and UI skills hand work to other
models through T3 Code, so they need to run inside T3 Code.

### dependabot-merge

Merges the open Dependabot PRs one at a time: the cheapest and safest first,
the riskiest last. It asks Dependabot to rebase each PR and merges only after
fresh CI passes.

- **Use when:** a batch of Dependabot PRs is waiting.
- **Parameters:** none. If the repository has its own Dependabot notes, such
  as `docs/dependabot-prs.md`, those override the defaults.

### issue-review-loop

Another model reviews a GitHub issue before any code is written. The agent
updates the issue or pushes back, then asks for another round, until the
reviewer approves.

- **Use when:** an issue is written and you want it checked before work
  starts.
- **Parameters:** the reviewer: `sol`, `opus`, `glm` or `muse`. Example:
  `/issue-review-loop sol`.
- **Needs:** T3 Code.

### pr-review-loop

For finished work: the agent reviews its own diff, opens the PR and waits for
CI. Then another model reviews the PR in rounds, and the agent fixes or
pushes back until the reviewer approves.

- **Use when:** a feature is done and ready for review.
- **Parameters:** the reviewer: `sol`, `opus`, `glm` or `muse`. Example:
  `/pr-review-loop opus`.
- **Needs:** T3 Code.

### site-discovery

Finds the comparable websites before a product site is designed: reads the
repo, asks a short brief, searches the category and — except at scan depth —
one adjacent industry, filters template slop and stale listicles, and hands over an evidence-only
candidates doc — ending with the user picking three to five sites.

- **Use when:** a marketing or product website is about to be built or
  redesigned, and the research should come before the design.
- **Parameters:** depth: `scan`, `standard` (default) or `deep`; any number
  in the depth table can be overridden inline.
- **With:** `site-dissect`, which measures the picked sites and proposes the
  direction.
- **Needs:** web search and page fetching.

### site-dissect

Dissects comparable websites by measurement, not taste: computed styles —
type scale, palette, section rhythm, page length — from each picked site and
the current one, a three-layer synthesis into keep/change/reject lists, and
two or three anti-convergent directions ending in a tiered `DESIGN.md`
proposal, approval-gated.

- **Use when:** the candidate sites are chosen — by `site-discovery` or named
  by the user — and the direction must be grounded in measurement.
- **Parameters:** the sites; nothing else.
- **With:** `ui-design`, whose DESIGN.md conventions the proposal follows and
  which implements it; `ui-council` for before/after scoring when a
  screenshot path exists.
- **Needs:** a browser that can run a script on the page; degrades to
  fetched text.

### ui-council

A panel of models rates screenshots of an app's screens without knowing what
changed. The agent improves the UI between rounds, then shows each screen
before and after, with the scores.

- **Use when:** you want screens scored, critiqued or improved.
- **Parameters:** all optional. The skill asks for any that are missing:
    - **Platform:** `android` (default), `ios` or `web`.
    - **Screens and states:** for example Settings when signed out, signed in,
      after an error, and with large text. You can also ask for the whole app.
    - **Raters:** `sol` and `opus` by default.
    - **When to stop:** a number of rounds (default 1), or a target average
      score, such as 9.0, with a round limit (default 3).
    - **Mode:** improve (default) or rate only.
    - **Rubric:** the default criteria, or `ui-design`'s design rubric, with
      `DESIGN.md` identity.
    - **Issue:** an existing issue whose decisions the changes must respect.
- **Example:** `/ui-council android, Settings signed in and signed out, until
  9.0`.
- **Needs:** T3 Code, plus an emulator, a simulator or the browser preview.

### ui-design

The designer's half of the UI work: seven dimensions with anchors and named
moves, and a `DESIGN.md` convention that keeps refined screens coherent with
the rest of the app.

- **Use when:** diagnosing or redesigning screens yourself, or scoring and
  improving them with a designer's rubric instead of generic taste.
- **With:** `ui-council`, which supplies the blind raters and the rounds.
- **Example:** `/ui-council onboarding, ui-design rubric, until 9.0`, or
  alone: `redesign Settings to the design language, DESIGN.md first`.
- **Needs:** nothing on its own; with `ui-council`, what ui-council needs.

## Install

Clone this repository, then run:

```bash
./link.sh
```

The script links every skill folder into each CLI's skills folder:
`~/.claude/skills/`, `~/.codex/skills/` and `~/.config/opencode/skills/`.

- **Edits take effect at once.** The links point into this checkout. That
  also means switching branches changes what the agents see.
- **Re-run it after adding or removing a skill.** It's safe to re-run: it
  never replaces a real folder, and it removes links to deleted skills.
- **Leave two folders alone:** `~/.claude/skills/synced/` and
  `~/.codex/skills/.system/`. The apps manage them.

## Writing a skill

### Steps

1. Copy `_template/` to a new folder named after the skill. Folders whose
   names start with `_` are never linked.
2. Write `SKILL.md`, then run `./link.sh`.
3. Add the skill to [Skills](#skills) above.
4. Run the checks, then open a PR.

### Layout

```text
<skill-name>/
  SKILL.md            # required: frontmatter with name and description
  references/         # optional: details that SKILL.md links to
  scripts/            # optional: fixed steps, called by relative path
  agents/openai.yaml  # optional: display name shown in Codex and T3 Code
```

### Frontmatter

- **`name`:** the folder's name. It may only use lowercase letters, digits and
  single hyphens, not at the start or end, and is at most 64 characters.
- **`description`:** at most 1,024 characters. Agents use it to decide when
  to load the skill, so say what the skill does and when to use it.
- **Other fields** are optional, and some CLIs ignore them.

### Guidelines

- Describe actions, such as "read the file" or "run `scripts/check.sh`", not
  one CLI's tool names.
- Keep `SKILL.md` short, and move detail into `references/`.
- This repository is public: no credentials, personal details or
  project-specific content. See [AGENTS.md](AGENTS.md).
- A skill for one project belongs in that project's repository, in
  `.claude/skills/` with `.agents/skills` linked to it.

### Checks

Install the tools with `npm ci`, using the Node version in `.nvmrc`. Then run:

```bash
npm run check:skills   # frontmatter and agents/openai.yaml
npm run lint:md        # markdown style
```

CI runs both on every PR and on every push to `main`.
