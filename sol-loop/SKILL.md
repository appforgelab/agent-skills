---
name: sol-loop
description: Use when the user says "sol loop"
metadata:
  harness: [claude, codex, opencode]
---

# Sol Loop

When you finish working on a feature, self-review and fix until happy, then
open a PR, then hand it to GPT Sol 6.1 xhigh for review. Fix what you think is
worth it, minimally if possible. Beware of scope creep: it's better to open a
follow-up issue than to start a big change. Don't be afraid to push back. After
you've made the changes or pushed back, hand it back for review, in a loop.

## How

1. Self-review the diff and fix until you're happy. Run the checks the
   project requires before a PR.
2. Open the PR. Saying "sol loop" authorizes it, so don't ask first.
3. Start a review with T3's `delegate_task`:
   - target: provider instance `codex`, model `gpt-6.1-sol`,
     options `{"reasoningEffort": "xhigh"}`
   - prompt: the PR URL, what the feature is for, and that the reviewer should
     review only (no edits, no PR comments) and report findings back.
4. For each finding, fix it minimally, push back with a reason, or open a
   follow-up issue. Push the fixes.
5. Start the next round with a new `delegate_task` call and a new
   `clientRequestId`. Include the original brief, the earlier findings, and
   what you did or why you pushed back on each.
6. Stop when the reviewer has nothing left worth fixing, or only points you
   have already pushed back on. Then report to the user: the PR, what changed
   in each round, what you pushed back on, and any follow-up issues.

If `delegate_task` isn't available, say so and stop. Don't fake the review.
