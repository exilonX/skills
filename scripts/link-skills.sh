#!/usr/bin/env bash
set -euo pipefail

# NOTE: This is a dev-only script, intended for use by maintainers of this repo.
# It is not a supported installer.
#
# Links all skills in the repository into the local skill directories used by
# each agent harness:
#   - ~/.claude/skills: Claude Code
#   - ~/.agents/skills: Codex and other Agent Skills-compatible harnesses
# Each entry is a symlink into this repo, so a `git pull` is all that's needed
# to keep installed skills up to date.
#
# Fork additions on top of upstream's version:
#   - skills/in-progress/ is skipped alongside skills/deprecated/.
#   - A skill that gets renamed, deprecated, or deleted would otherwise leave an
#     orphan symlink behind in each destination. The .linked-from-repo manifest
#     records what this script installed on the previous run, so the sweep can
#     prune exactly those orphans and never touch skills installed from
#     anywhere else.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DESTS=("$HOME/.claude/skills" "$HOME/.agents/skills")

# Collect the repo's skills once, link into every destination.
names=()
srcs=()
while IFS= read -r -d '' skill_md; do
  src="$(dirname "$skill_md")"
  names+=("$(basename "$src")")
  srcs+=("$src")
done < <(find "$REPO/skills" -name SKILL.md -not -path '*/node_modules/*' \
  -not -path '*/deprecated/*' -not -path '*/in-progress/*' -print0)

for DEST in "${DESTS[@]}"; do
  # If $DEST is a symlink that resolves into this repo, we'd end up writing the
  # per-skill symlinks back into the repo's own skills/ tree. Detect and bail
  # out instead of polluting the working copy.
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

  for i in "${!names[@]}"; do
    name="${names[$i]}"
    src="${srcs[$i]}"
    target="$DEST/$name"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      rm -rf "$target"
    fi

    ln -sfn "$src" "$target"
    echo "linked $name -> $src ($DEST)"
  done

  # Prune skills this script installed previously that it no longer installs.
  if [ -f "$MANIFEST" ]; then
    while IFS= read -r stale; do
      stale="${stale%/}"
      case "$stale" in ''|.|..|*/*) continue ;; esac
      for name in "${names[@]}"; do
        [ "$name" = "$stale" ] && continue 2
      done
      rm -rf "${DEST:?}/$stale"
      echo "pruned $stale (no longer in repo) ($DEST)"
    done < "$MANIFEST"
  fi

  printf '%s\n' "${names[@]}" | sort -u > "$MANIFEST"
done
