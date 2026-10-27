#!/usr/bin/env bash
# Symlink every skill in this repo into each agent CLI's user skills folder.
# Safe to re-run: it never overwrites real folders and removes links whose
# skill was deleted from this repo.
set -euo pipefail

repo="$(cd "$(dirname "$0")" && pwd)"
targets=(
  "$HOME/.claude/skills"   # Claude Code
  "$HOME/.codex/skills"    # Codex
  "$HOME/.config/opencode/skills"  # OpenCode
)

for target in "${targets[@]}"; do
  mkdir -p "$target"

  # Drop links into this repo whose skill no longer exists.
  for link in "$target"/*; do
    [[ -L "$link" ]] || continue
    dest="$(readlink "$link")"
    if [[ "$dest" == "$repo"/* && ! -e "$dest" ]]; then
      rm "$link" && echo "removed stale $link"
    fi
  done

  for skill in "$repo"/*/; do
    skill="${skill%/}"
    [[ -f "$skill/SKILL.md" ]] || continue
    name="$(basename "$skill")"
    [[ "$name" == _* ]] && continue
    link="$target/$name"
    if [[ -e "$link" && ! -L "$link" ]]; then
      echo "skip $link: a real folder already exists there" >&2
      continue
    fi
    ln -sfn "$skill" "$link"
    echo "linked $link"
  done
done
