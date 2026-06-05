#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Bundle file changes into grouped commits.
#
# Usage:
#   ./bundle-commits.sh            # dry-run (preview only)
#   ./bundle-commits.sh --apply    # actually create commits
#
# Edit the GROUPS array below to customize commit grouping.
# Each group: "commit message:::regex"
# Files are assigned to the FIRST matching group.
# Unmatched files go into a catch-all commit at the end.
# ============================================================

DRY_RUN=true
[[ "${1:-}" == "--apply" ]] && DRY_RUN=false

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Define commit groups ─────────────────────────────────────
# Format: "commit message:::egrep-pattern"
# Uses ::: as delimiter to avoid conflicts with | in regex.

GROUP_MSGS=()
GROUP_PATTERNS=()

GROUP_MSGS+=("chore: update config and formatting")
GROUP_PATTERNS+=("^\.prettier|^turbo\.json|^bun\.lock|^docker/")

GROUP_MSGS+=("chore: update plan documents")
GROUP_PATTERNS+=("^phase-.*\.plan\.md|^plan-")

GROUP_MSGS+=("feat(electron): update electron app")
GROUP_PATTERNS+=("^apps/electron/")

GROUP_MSGS+=("feat(web): update web app components")
GROUP_PATTERNS+=("^apps/web/app/_components/|^apps/web/app/_hooks/|^apps/web/app/globals\.css|^apps/web/app/layout\.tsx")

GROUP_MSGS+=("feat(web): update API routes")
GROUP_PATTERNS+=("^apps/web/app/api/")

GROUP_MSGS+=("feat(web): update web app pages and config")
GROUP_PATTERNS+=("^apps/web/")

GROUP_MSGS+=("feat(auth): update auth package")
GROUP_PATTERNS+=("^packages/auth/")

GROUP_MSGS+=("feat(db): update database packages")
GROUP_PATTERNS+=("^packages/db/|^packages/db-mongo/")

GROUP_MSGS+=("feat(draft): update draft package")
GROUP_PATTERNS+=("^packages/draft/")

GROUP_MSGS+=("feat(types): update types package")
GROUP_PATTERNS+=("^packages/types/")

GROUP_MSGS+=("feat(packages): update remaining packages")
GROUP_PATTERNS+=("^packages/")

GROUP_MSGS+=("chore: archive backup files")
GROUP_PATTERNS+=("^backup/")

GROUP_MSGS+=("chore: update scripts")
GROUP_PATTERNS+=("^scripts/")

# ── Collect all changed files ────────────────────────────────
TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

git status --porcelain | awk '{
  # Remove the 2-char status + space prefix
  s = substr($0, 4)
  # Handle renames: "old -> new"
  idx = index(s, " -> ")
  if (idx > 0) s = substr(s, idx + 4)
  print s
}' > "$TMPDIR_WORK/remaining"

total=$(wc -l < "$TMPDIR_WORK/remaining")
if [[ "$total" -eq 0 ]]; then
  echo -e "${GREEN}Nothing to commit – working tree clean.${NC}"
  exit 0
fi

echo -e "${BOLD}Found $total changed file(s).${NC}"
echo

# ── Assign files to groups using grep ────────────────────────
num_groups=${#GROUP_MSGS[@]}
for (( i=0; i<num_groups; i++ )); do
  pattern="${GROUP_PATTERNS[$i]}"

  # Match files for this group from remaining pool
  grep -E "$pattern" "$TMPDIR_WORK/remaining" > "$TMPDIR_WORK/group_$i" 2>/dev/null || true

  # Remove matched files from remaining pool
  if [[ -s "$TMPDIR_WORK/group_$i" ]]; then
    grep -vE "$pattern" "$TMPDIR_WORK/remaining" > "$TMPDIR_WORK/remaining.tmp" 2>/dev/null || true
    mv "$TMPDIR_WORK/remaining.tmp" "$TMPDIR_WORK/remaining"
  fi
done

# Whatever's left is ungrouped
cp "$TMPDIR_WORK/remaining" "$TMPDIR_WORK/ungrouped"

# ── Preview / Apply ─────────────────────────────────────────
commit_count=0
MAX_PREVIEW=20

do_commit() {
  local msg="$1"
  local file_list="$2"
  local count
  count=$(wc -l < "$file_list")
  (( commit_count++ )) || true

  echo -e "${CYAN}━━━ Commit $commit_count:${NC} ${BOLD}$msg${NC}"
  echo -e "${YELLOW}  $count file(s):${NC}"

  if [[ $count -le $MAX_PREVIEW ]]; then
    sed 's/^/    /' "$file_list"
  else
    head -n "$MAX_PREVIEW" "$file_list" | sed 's/^/    /'
    echo -e "    ${DIM}... and $((count - MAX_PREVIEW)) more${NC}"
  fi
  echo

  if [[ "$DRY_RUN" == false ]]; then
    git reset --quiet 2>/dev/null || true
    xargs -d '\n' git add -- < "$file_list" 2>/dev/null || true
    git commit -m "$msg" --quiet 2>/dev/null
    echo -e "  ${GREEN}✓ committed${NC}"
    echo
  fi
}

for (( i=0; i<num_groups; i++ )); do
  [[ ! -s "$TMPDIR_WORK/group_$i" ]] && continue
  do_commit "${GROUP_MSGS[$i]}" "$TMPDIR_WORK/group_$i"
done

if [[ -s "$TMPDIR_WORK/ungrouped" ]]; then
  do_commit "chore: misc updates" "$TMPDIR_WORK/ungrouped"
fi

echo -e "${BOLD}Total: $commit_count commit(s)${NC}"

if [[ "$DRY_RUN" == true ]]; then
  echo
  echo -e "${YELLOW}This was a dry run. Run with ${BOLD}--apply${NC}${YELLOW} to create commits.${NC}"
  echo -e "  ${BOLD}./bundle-commits.sh --apply${NC}"
fi
