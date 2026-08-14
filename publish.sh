#!/bin/bash
# Publish the Pokemon Null docs to GitHub Pages.
#   ./publish.sh "what changed"
set -e
cd "$(dirname "$0")"

# index.html is what Pages serves at the repo root; main.html is the shared
# link. They must stay identical or the two links drift apart.
if ! cmp -s main.html index.html; then
  echo "main.html and index.html differ - syncing index.html from main.html"
  cp main.html index.html
fi

git add -A
if git diff --cached --quiet; then
  echo "nothing to publish - no changes"
  exit 0
fi
git commit -q -m "${1:-Update docs}"
git push -q origin main
echo "pushed. live in ~1 min; hard-refresh (Cmd+Shift+R) to skip the 10-min cache."
