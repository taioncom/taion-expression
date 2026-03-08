#!/usr/bin/env bash
set -euo pipefail

# Release script for @taioncom/taion-expression
# Usage: npm run release [patch|minor|major] [--dry-run]

BUMP_TYPE="${1:-patch}"
DRY_RUN=false

for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    DRY_RUN=true
  fi
done

# Strip --dry-run from BUMP_TYPE if it was the first arg
if [[ "$BUMP_TYPE" == "--dry-run" ]]; then
  BUMP_TYPE="patch"
fi

if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "Error: Invalid bump type '$BUMP_TYPE'. Must be patch, minor, or major."
  exit 1
fi

if $DRY_RUN; then
  echo "=== DRY RUN MODE ==="
fi

# ── Pre-flight checks ──────────────────────────────────────────────

echo "Running pre-flight checks..."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: Working directory is not clean. Commit or stash changes first."
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Error: Must be on 'main' branch (currently on '$BRANCH')."
  exit 1
fi

if ! $DRY_RUN; then
  if ! npm whoami &>/dev/null; then
    echo "Error: Not logged in to npm. Run 'npm login' first."
    exit 1
  fi
fi

echo "Pre-flight checks passed."

# ── Bump version ────────────────────────────────────────────────────

npm version "$BUMP_TYPE" --no-git-tag-version >/dev/null
NEW_VERSION="$(node -p "require('./package.json').version")"
echo "Bumped version to $NEW_VERSION"

# ── Update CHANGELOG.md ────────────────────────────────────────────

TODAY="$(date +%Y-%m-%d)"

echo ""
echo "Enter changelog entry for v$NEW_VERSION (end with an empty line):"
CHANGELOG_ENTRY=""
while IFS= read -r line; do
  [[ -z "$line" ]] && break
  CHANGELOG_ENTRY="${CHANGELOG_ENTRY}${line}
"
done

if [[ -z "$CHANGELOG_ENTRY" ]]; then
  echo "Error: Changelog entry cannot be empty."
  git checkout -- package.json
  exit 1
fi

CHANGELOG_HEADER="## [$NEW_VERSION] - $TODAY

$CHANGELOG_ENTRY"

if [[ -f CHANGELOG.md ]]; then
  EXISTING="$(cat CHANGELOG.md)"
  printf '%s\n\n%s\n' "$CHANGELOG_HEADER" "$EXISTING" > CHANGELOG.md
else
  printf '# Changelog\n\n%s\n' "$CHANGELOG_HEADER" > CHANGELOG.md
fi

echo "Updated CHANGELOG.md"

# ── Build and test ──────────────────────────────────────────────────

echo "Building and running tests..."
npm run build
npm run test:lint
npm run test:prettier
npm run test:unit
npm run test:smoke
echo "Build and tests passed."

# ── Commit, tag, publish ────────────────────────────────────────────

git add package.json CHANGELOG.md
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"

if $DRY_RUN; then
  echo ""
  echo "=== DRY RUN COMPLETE ==="
  echo "Version: $NEW_VERSION"
  echo "Tag: v$NEW_VERSION"
  echo "Skipped: npm publish, git push, GitHub release"
  echo ""
  echo "To undo the dry-run commit and tag:"
  echo "  git tag -d v$NEW_VERSION && git reset --soft HEAD~1 && git checkout -- package.json CHANGELOG.md"
  exit 0
fi

npm publish --access public
git push
git push --tags

# ── GitHub release (optional) ──────────────────────────────────────

if command -v gh &>/dev/null; then
  echo "Creating GitHub release..."
  gh release create "v$NEW_VERSION" --title "v$NEW_VERSION" --notes "$CHANGELOG_ENTRY"
  echo "GitHub release created."
else
  echo "Skipping GitHub release (gh CLI not installed)."
fi

echo ""
echo "Released v$NEW_VERSION successfully!"
