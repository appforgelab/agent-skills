---
name: pr-review-loop
description: Have another model review a PR in a loop until it's done. Use when the user asks for a model (for example Sol or Opus) to review a PR or feature in a loop, or says "sol loop". The argument is the reviewer's short name.
metadata:
  harness: [claude, codex, opencode]
---

# PR Review Loop

When you finish working on a feature, self-review and fix until happy, then
open a PR, then hand it to the reviewer for review. Fix what you think is
worth it, minimally if possible. Beware of scope creep: it's better to open a
follow-up issue than to start a big change. Don't be afraid to push back.
After you've made the changes or pushed back, hand it back for review, in a
loop.

## How

1. Self-review the diff and fix until you're happy. Run the checks the
   project requires before a PR.
2. Open the PR. Asking for this loop authorizes it, so don't ask first.
   Then call T3's `watch_pull_request` and end your turn. If T3 reports a
   failed check, fix it, push, and wait again. Start the review only once T3
   reports that the required checks passed.
3. Start a review with T3's `delegate_task`:
   - target: the reviewer the user named ("sol", "opus", "glm", "muse", ...).
     Find it with T3's `orchestrator_capabilities` (pass the name as
     `search`). Prefer the newest version, and the full model over lighter
     variants such as Flash. If nothing matches, or it is still unclear, ask
     the user which one. Set reasoning effort to `xhigh` where the model
     offers it; otherwise leave it unset.
   - prompt: the PR URL, what the feature is for, and that the reviewer should
     review only (no edits, no PR comments) and report findings back.
4. For each finding, fix it minimally, push back with a reason, or open a
   follow-up issue. Push the fixes, and wait for the required checks to pass
   again before the next round.
5. Start the next round with a new `delegate_task` call and a new
   `clientRequestId`. Include the original brief, the earlier findings, and
   what you did or why you pushed back on each.
6. Stop when the reviewer has nothing left worth fixing, or only points you
   have already pushed back on. Call `unwatch_pull_request`, then report to
   the user: the PR, what changed in each round, what you pushed back on,
   and any follow-up issues.

If `delegate_task` isn't available, say so and stop. Don't fake the review.
