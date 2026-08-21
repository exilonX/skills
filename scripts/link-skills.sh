#!/usr/bin/env bash
set -euo pipefail

# Populates ~/.claude/skills with every non-deprecated skill in the repository
# so the local Claude CLI loads them. Behaviour depends on the platform:
#   - macOS/Linux: real symlinks (edits in the repo are live immediately)
#   - Windows + Git Bash (default): file copies (re-run after editing to sync)
# Skills under skills/deprecated/ and skills/in-progress/ are skipped
# intentionally — link them individually later if needed.
#
# A skill that gets renamed, deprecated, or deleted leaves an orphan copy
# behind in $DEST. The manifest below records what this script installed on
# the previous run, so the sweep can prune exactly those orphans and never
# touch skills installed from anywhere else.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/.claude/skills"

# If ~/.claude/skills is a symlink that resolves into this repo, we'd end up
# writing the per-skill symlinks back into the repo's own skills/ tree. Detect
# and bail out instead of polluting the working copy.
if [ -L "$DEST" ]; then
  resolved="$(readlink -f "$DEST")"
  case "$resolved" in
    "$REPO"|"$REPO"/*)
      echo "error: $DEST is a symlink into this repo ($resolved)." >&2
      echo "Remove it (rm \"$DEST\") and re-run; the script will recreate it as a real dir." >&2
      exit 1
      ;;
  esac
fi

mkdir -p "$DEST"

MANIFEST="$DEST/.linked-from-repo"
installed="$(mktemp)"
trap 'rm -f "$installed"' EXIT

find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' \
  -not -path '*/deprecated/*' -not -path '*/in-progress/*' -print0 |
while IFS= read -r -d '' skill_md; do
  src="$(dirname "$skill_md")"
  name="$(basename "$src")"
  target="$DEST/$name"

  if [ -e "$target" ] && [ ! -L "$target" ]; then
    rm -rf "$target"
  fi

  ln -sfn "$src" "$target"
  echo "$name" >> "$installed"
  echo "linked $name -> $src"
done

# Prune skills this script installed previously that it no longer installs.
if [ -f "$MANIFEST" ]; then
  while IFS= read -r name; do
    name="${name%/}"
    case "$name" in ''|.|..|*/*) continue ;; esac
    grep -qxF "$name" "$installed" && continue
    rm -rf "${DEST:?}/$name"
    echo "pruned $name (no longer in repo)"
  done < "$MANIFEST"
fi

sort -u "$installed" > "$MANIFEST"
