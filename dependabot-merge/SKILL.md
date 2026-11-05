---
name: dependabot-merge
description: Merge a batch of Dependabot PRs safely, one at a time, cheapest and safest first. Use when the user asks to merge, triage or batch-process Dependabot PRs.
metadata:
  harness: [claude, codex, opencode]
---

# Dependabot Merge

Merge all open Dependabot PRs, strictly one at a time. Each
`@dependabot rebase` comment costs a full CI run, so never act on two PRs
in the same turn. Merge what is fast and likely green first, and what is
slow or risky last: each merge advances `main` and forces the remaining
PRs to rebase, so bank the safe ones before hitting the one most likely
to break. Keep it simple: follow the loop below rather than building
tooling around it.

If the repo has its own Dependabot doc (often `docs/dependabot-prs.md`),
its failure tables and timings override the defaults here.

## Order the PRs

List the open PRs with their changed files:

```bash
gh pr list --state open --author app/dependabot --limit 50 \
    --json number,title,files
```

Sort them without hardcoding the repo's layout:

1. If the check workflows have no `paths:` filters, every PR costs the
   same CI: order by risk, not speed. Dev-tooling and `github_actions`
   bumps first, application dependency bumps last.
2. If they do have `paths:` filters, map each PR's changed files to the
   jobs they trigger, estimate those jobs' duration from recent runs
   (`gh run list`), and sort cheapest first.
3. When uncertain, fall back to the risk ladder in 1, and say so in the
   report rather than presenting a guess as a measurement.

## Each cycle

1. Comment `@dependabot rebase` on the current PR only. Never rebase,
   push or force-push a Dependabot branch yourself: the comment makes
   Dependabot re-resolve lockfiles instead of git-merging them.
2. Wait for the rebase to land (2-10 min) and CI to finish. Use a PR
   watch if your harness offers one; otherwise poll about once a minute.
3. If the comment is ignored (no reaction on it, branch unmoved),
   re-comment exactly once. Never spam: queued rebases force-push
   mid-run and restart CI.
4. Merge only when all of these hold:
   - the check run IDs are new, not last cycle's green run;
   - `gh api repos/<owner>/<repo>/compare/main...<branch>` reports
     `behind_by == 0`;
   - `gh pr view <n> --json mergeable,mergeStateStatus` reports
     `MERGEABLE` / `CLEAN` (`UNSTABLE` = still settling, `DIRTY` =
     conflict, rebase again).
5. Merge with `gh pr merge <n> --squash --delete-branch`. On a 5xx,
   first check `gh pr view <n> --json state` — it usually applied — then
   retry once after ~60s.
6. If push-to-`main` workflows include deploy jobs, watch the merge
   commit's own run on `main`
   (`gh run list --branch main --commit <merge-sha>`) until deploy
   finishes. PR checks say nothing about deployability.
7. Move to the next PR and repeat.

## Reading failures

- Lockfile-looking failures (lockfile out of sync, lockfile conflicts,
  audit failures on a stale lock) → `@dependabot rebase` again.
- Failures caused by the bump (compile, analyze, tests) → fix the code
  if the fix is small, otherwise hold the PR and report.
- Failures unrelated to the diff (auth, timing, infra) → rerun the
  failed jobs once (`gh run rerun <id> --failed`); if they persist,
  hold and report.
- An audit failure that survives a fresh rebase may be an upstream pin
  with no fixed release available: hold and report; do not fight it.
- A required SDK or repository variable that is too old is a human
  decision: never edit workflow files or repository variables. Hold the
  PR and report what is needed.

## When a rebase comment won't stick

Escalate in order, then stop:

1. Comment `@dependabot rebase` via `gh`, then watch for a reaction on
   the comment or branch movement for ~3 min.
2. Re-comment once (rule above).
3. If the API comment keeps being ignored, the web UI still works. If
   your harness has an in-app browser whose default profile is already
   authenticated for GitHub (in T3 Code: the `preview_*` tools), open
   the PR and post the comment there — or delegate exactly that one
   comment to a browser-capable model. Read-only otherwise: never enter
   credentials, and never drive the OS keyboard.
4. Otherwise ask the user to comment from their browser, and continue
   with the next PR meanwhile.

## Report

At the end, report: merged PRs, held PRs with reasons, follow-ups, and
anything that needs a human decision.
