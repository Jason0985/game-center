---
name: ship
description: Merge the current branch into main via GitHub PR, pull main, run npm run deploy, then switch back to the branch. Use when the user says "ship" or /ship.
---

Run `npm run ship` from the repo root (it runs `scripts/ship.sh`) with a 10-minute timeout and report the result.

- If it stops because of uncommitted changes, tell the user and ask whether to commit them first; do not commit on your own.
- If the PR merge fails (e.g. conflicts), report the error; the script stays on the branch.
- Report the deployed result and confirm which branch is checked out at the end.
