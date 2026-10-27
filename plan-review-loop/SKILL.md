---
name: plan-review-loop
description: Have another model review an issue or plan in a loop before any code is written. Use when the user asks for a model (for example Sol or Opus) to review a plan or issue, or says "sol plan". The argument is the reviewer's short name.
metadata:
  harness: [claude, codex, opencode]
---

# Plan Review Loop

Before writing any code, hand the issue or plan to the reviewer for review.
Update the plan with what you think is worth it. Keep it simple: push back on
extra machinery, rare edge cases and precision nobody needs, and move
optional extras to a follow-up issue. Don't be afraid to push back. After
you've updated the plan or pushed back, hand it back for review, in a loop.

## How

1. Make sure the plan is written down: a GitHub issue, or a draft in the
   conversation. If it's an issue, asking for this loop authorizes editing
   its body, so don't ask first.
2. Start a review with T3's `delegate_task`:
   - target: the reviewer the user named ("sol", "opus", "glm", "muse", ...).
     Find it with T3's `orchestrator_capabilities` (pass the name as
     `search`). Prefer the newest version, and the full model over lighter
     variants such as Flash. If nothing matches, or it is still unclear, ask
     the user which one. Set reasoning effort to `xhigh` where the model
     offers it; otherwise leave it unset.
   - prompt: the issue URL or the full plan text, the goal, and that the
     reviewer should review only (no edits, no comments) and report gaps,
     risks and unneeded complexity.
3. For each finding, update the plan, push back with a reason, or move it to
   a follow-up issue. Don't decide the user's calls (scope, product choices,
   wording users see): collect them as questions for the user.
4. Start the next round with a new `delegate_task` call and a new
   `clientRequestId`. Include the current plan, the earlier findings, and
   what you did or why you pushed back on each.
5. Stop when the reviewer has nothing left worth changing, or only points you
   have already pushed back on. Then report to the user: what changed, what
   you pushed back on, follow-up issues, and the open questions. Don't start
   implementing.

If `delegate_task` isn't available, say so and stop. Don't fake the review.
