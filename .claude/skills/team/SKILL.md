---
name: team
description: Runs a task through the game-center engineering team — architect, engineer, reviewer, optimizer — one after another, each building on the previous result.
argument-hint: <task description>
disable-model-invocation: true
---

Run this task through the team of project subagents, sequentially:

**Task:** $ARGUMENTS

Each subagent starts without this conversation's context. Pass it everything it needs: the task, and the full relevant output of the previous steps (not a one-line summary).

1. **architect** — design the change. Show the user a short summary of the design (goal, file plan, risks). If the architect lists open questions that are genuinely the user's decision, ask them now with AskUserQuestion and stop until answered. If the design would drop or rename a DB column, break the live site, or cost money, get the user's go-ahead before continuing.
2. **engineer** — implement the design. Give it the full design.
3. **reviewer** — review the resulting diff against the design. Give it the design and the engineer's report.
4. **optimizer** — fix the review findings and optimize. Give it the review findings and the engineer's report. Skip this step if the reviewer found nothing to fix and the change is small; say that you skipped it.

After the team is done, verify yourself (`git status`, `npx ng build`, `npx ng test --watch=false`) instead of trusting the reports, then report to the user in German:
- what was built (files, with links),
- review findings and how each was resolved,
- verification results as you observed them,
- what still needs to happen: migrations to apply, edge functions to deploy, live deploy. Do not apply migrations, deploy or commit without the user asking for it.
