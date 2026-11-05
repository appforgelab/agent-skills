---
name: issue-review-loop
description: Have another model review a GitHub issue in a loop before any code is written. Use when the user asks a model to review an issue. The argument is the reviewer's short name, one of sol, opus, glm or muse.
metadata:
  harness: [claude, codex, opencode]
---

# Issue Review Loop

Before writing any code, hand the GitHub issue to the reviewer for review.
Review only what is written in the issue, not the discussion behind it: the
issue must stand on its own. Update the issue with what you think is worth
it. Keep it simple: push back on extra machinery, edge cases that can't
realistically occur, and precision nobody needs, and move optional extras
to a follow-up issue. Rare paths through auth, billing or data loss are
the job, not nitpicks. Don't be afraid to push back. After you've updated
the issue or pushed back, hand it back for review, in a loop.

## How

1. Review the GitHub issue as written. Asking for this loop authorizes
   editing its body, so don't ask first. If there is no issue, say so and
   stop.
2. Start a review with T3's `delegate_task`:
   - target: the reviewer the user named: sol, opus, glm or muse.
     Find it with T3's `orchestrator_capabilities` (pass the name as
     `search`). Prefer the newest version, and the full model over lighter
     variants such as Flash. If nothing matches, or it is still unclear, ask
     the user which one. Set reasoning effort to `xhigh` where the model
     offers it; otherwise leave it unset.
   - prompt: the issue URL, and that the reviewer should review only (no
     edits, no comments), report only findings it would block on, and say
     explicitly if it would approve. It may add non-blocking observations
     as possible follow-ups, kept separate. Every finding must name a
     realistic gap, risk or failure; unneeded complexity is one too.
3. For each blocking finding, update the issue, push back with a reason,
   or move it to a follow-up issue. Non-blocking ones become follow-ups
   only when worth someone's time; otherwise drop them. If the finding is
   about something already decided but not written down, write the
   decision into the issue. Don't decide the user's calls (scope, product
   choices, wording users see): collect them as questions for the user.
4. Start the next round with a new `delegate_task` call and a new
   `clientRequestId`. Include the issue URL, the earlier findings, and what
   you did or why you pushed back on each.
5. Stop when the reviewer approves, or what's left is style, preference or
   points you have already pushed back on; if two rounds in a row yield
   only pushbacks or nits, don't start another. Then report to the user:
   what changed, what you pushed back on, follow-up issues, and the open
   questions. Don't start implementing.

If `delegate_task` isn't available, say so and stop. Don't fake the review.
