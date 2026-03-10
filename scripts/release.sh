#!/usr/bin/env bash
set -euo pipefail

# Interactive release script for @taioncom/taion-expression
#
# Usage:
#   npm run release              # interactive release
#   npm run release -- --dry-run # interactive release without publishing

DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *)
      echo "Error: Unknown argument '$arg'."
      echo "Usage: npm run release [-- --dry-run]"
      exit 1
      ;;
  esac
done

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
echo ""

# ── Step 1: Version ────────────────────────────────────────────────

CURRENT_VERSION="$(node -p "require('./package.json').version")"
BUMP_TYPE=""

echo "Current version: $CURRENT_VERSION"
echo ""
echo "What would you like to release?"
echo "  1) Release current version ($CURRENT_VERSION)"
echo "  2) Bump patch  ($(node -e "const v='$CURRENT_VERSION'.split('.'); v[2]++; console.log(v.join('.'))"))"
echo "  3) Bump minor  ($(node -e "const v='$CURRENT_VERSION'.split('.'); v[1]++; v[2]=0; console.log(v.join('.'))"))"
echo "  4) Bump major  ($(node -e "const v='$CURRENT_VERSION'.split('.'); v[0]++; v[1]=0; v[2]=0; console.log(v.join('.'))"))"
echo ""
read -rp "Choose [1-4]: " VERSION_CHOICE

case "$VERSION_CHOICE" in
  1) ;;
  2) BUMP_TYPE="patch" ;;
  3) BUMP_TYPE="minor" ;;
  4) BUMP_TYPE="major" ;;
  *)
    echo "Aborted."
    exit 1
    ;;
esac

if [[ -n "$BUMP_TYPE" ]]; then
  npm version "$BUMP_TYPE" --no-git-tag-version >/dev/null
fi

VERSION="$(node -p "require('./package.json').version")"
echo ""
echo "Version to release: $VERSION"

# ── Step 2: Changelog ──────────────────────────────────────────────

CHANGELOG_ENTRY=""
TODAY="$(date +%Y-%m-%d)"

echo ""
echo "Would you like to add a changelog entry?"
echo "  1) Skip (use existing CHANGELOG.md as-is)"
echo "  2) Add text to CHANGELOG.md"
echo ""
read -rp "Choose [1-2]: " CHANGELOG_CHOICE

case "$CHANGELOG_CHOICE" in
  1)
    echo "Keeping existing CHANGELOG.md."
    ;;
  2)
    echo ""
    echo "Enter changelog entry for v$VERSION (end with an empty line):"
    while IFS= read -r line; do
      [[ -z "$line" ]] && break
      CHANGELOG_ENTRY="${CHANGELOG_ENTRY}${line}
"
    done

    if [[ -z "$CHANGELOG_ENTRY" ]]; then
      echo "No text entered, keeping existing CHANGELOG.md."
    else
      CHANGELOG_HEADER="## [$VERSION] - $TODAY

$CHANGELOG_ENTRY"

      if [[ -f CHANGELOG.md ]]; then
        EXISTING="$(cat CHANGELOG.md)"
        printf '%s\n\n%s\n' "$CHANGELOG_HEADER" "$EXISTING" > CHANGELOG.md
      else
        printf '# Changelog\n\n%s\n' "$CHANGELOG_HEADER" > CHANGELOG.md
      fi
      echo "Updated CHANGELOG.md."
    fi
    ;;
  *)
    echo "Aborted."
    if [[ -n "$BUMP_TYPE" ]]; then
      git checkout -- package.json
    fi
    exit 1
    ;;
esac

# ── Step 3: Confirmation ──────────────────────────────────────────

HAS_CHANGES=false
if [[ -n "$(git status --porcelain)" ]]; then
  HAS_CHANGES=true
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Release Plan"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  Version:     $VERSION"
echo "  Tag:         v$VERSION"
if [[ -n "$BUMP_TYPE" ]]; then
  echo "  Version bump: $BUMP_TYPE ($CURRENT_VERSION -> $VERSION)"
else
  echo "  Version bump: none"
fi
if [[ -n "$CHANGELOG_ENTRY" ]]; then
  echo "  Changelog:   updated"
else
  echo "  Changelog:   unchanged"
fi
if $HAS_CHANGES; then
  echo "  Commit:      yes (release: v$VERSION)"
else
  echo "  Commit:      no (no changes)"
fi
if $DRY_RUN; then
  echo ""
  echo "  ** DRY RUN -- will NOT publish, push, or create GitHub release **"
fi
echo ""
echo "  Actions:"
echo "    - Build and run all tests"
if $HAS_CHANGES; then
  echo "    - Commit changes"
fi
echo "    - Create git tag v$VERSION"
if ! $DRY_RUN; then
  echo "    - Publish to npm"
  echo "    - Push to origin (commits + tags)"
  if command -v gh &>/dev/null; then
    echo "    - Create GitHub release"
  fi
fi
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
read -rp "Proceed? [y/N]: " CONFIRM

if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo "Aborted."
  # Undo any local changes from version bump or changelog
  if $HAS_CHANGES; then
    git checkout -- .
  fi
  exit 1
fi

# ── Build and test ──────────────────────────────────────────────────

echo ""
echo "Building and running tests..."
npm run build
npm run test:lint
npm run test:prettier
npm run test:unit
npm run test:smoke
echo "Build and tests passed."

# ── Commit, tag, publish ────────────────────────────────────────────

if $HAS_CHANGES; then
  git add package.json CHANGELOG.md
  git commit -m "release: v$VERSION"
fi

git tag "v$VERSION"

if $DRY_RUN; then
  echo ""
  echo "=== DRY RUN COMPLETE ==="
  echo "Version: $VERSION"
  echo "Tag: v$VERSION"
  echo "Skipped: npm publish, git push, GitHub release"
  echo ""
  echo "To undo:"
  echo "  git tag -d v$VERSION"
  if $HAS_CHANGES; then
    echo "  git reset --soft HEAD~1 && git checkout -- ."
  fi
  exit 0
fi

npm publish --access public
git push
git push --tags

# ── GitHub release (optional) ──────────────────────────────────────

if command -v gh &>/dev/null; then
  echo "Creating GitHub release..."
  NOTES="Release v$VERSION"
  if [[ -f CHANGELOG.md ]]; then
    SECTION="$(awk "/^## .*$VERSION/{found=1; next} /^## /{found=0} found" CHANGELOG.md)"
    if [[ -n "$SECTION" ]]; then
      NOTES="$SECTION"
    fi
  fi
  gh release create "v$VERSION" --title "v$VERSION" --notes "$NOTES"
  echo "GitHub release created."
else
  echo "Skipping GitHub release (gh CLI not installed)."
fi

echo ""
echo "Released v$VERSION successfully!"
