#!/usr/bin/env bash
# ship: aktuellen Branch per PR in main mergen, main pullen, deployen, zurück zum Branch
set -euo pipefail

branch=$(git branch --show-current)
if [[ -z $branch || $branch == main ]]; then
  echo "ship: nicht auf einem Feature-Branch" >&2
  exit 1
fi
if [[ -n $(git status --porcelain) ]]; then
  echo "ship: uncommittete Änderungen – erst committen" >&2
  exit 1
fi

git push -u origin "$branch"
if [[ $(gh pr view "$branch" --json state -q .state 2>/dev/null) != OPEN ]]; then
  gh pr create --base main --head "$branch" --fill
fi
gh pr merge "$branch" --merge

# Ab hier immer zurück zum Branch, auch wenn Pull oder Deploy scheitern
trap 'git switch "$branch"' EXIT
git switch main
git pull --ff-only
npm run deploy
