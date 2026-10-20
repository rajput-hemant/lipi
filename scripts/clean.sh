#!/usr/bin/env bash
# Deletes dependencies, build output and caches. Keeps .env* and local data directories.
set -euo pipefail
cd "$(dirname "$0")/.."

DRY_RUN=false
SKIP_PROMPT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -y)
      SKIP_PROMPT=true
      shift
      ;;
    -h | --help)
      echo "Usage: bash scripts/clean.sh [--dry-run] [-y]"
      echo "  --dry-run  Print paths that would be removed"
      echo "  -y         Skip confirmation prompt"
      exit 0
      ;;
    *)
      echo "unknown option: $1" >&2
      exit 1
      ;;
  esac
done

echo "WARNING: this removes node_modules, build output (.next*, out, dist, coverage, test-results, playwright-report) and caches (.cache, *.tsbuildinfo)."
echo "Your .env* files and local data directories stay. You must run 'bun install' before anything else works."

if [[ "$SKIP_PROMPT" != true && "$DRY_RUN" != true ]]; then
  read -r -p "Delete these now? [y/N] " answer || exit 1
  [[ "$answer" == [yY] ]] || { echo "aborted, nothing deleted"; exit 1; }
fi

remove_path() {
  local path=$1
  if [[ ! -e "$path" ]]; then
    return 0
  fi
  if [[ "$DRY_RUN" == true ]]; then
    echo "would remove: $path"
  else
    rm -rf "$path"
    echo "removed: $path"
  fi
}

for dir in node_modules out dist coverage test-results playwright-report .cache; do
  remove_path "$dir"
done

shopt -s nullglob
for next_dir in .next*; do
  remove_path "$next_dir"
done
shopt -u nullglob

while IFS= read -r -d '' tsbuildinfo; do
  if [[ "$DRY_RUN" == true ]]; then
    echo "would remove: $tsbuildinfo"
  else
    rm -f "$tsbuildinfo"
    echo "removed: $tsbuildinfo"
  fi
done < <(find . -name '*.tsbuildinfo' -not -path './node_modules/*' -print0)

if [[ "$DRY_RUN" == true ]]; then
  echo "dry-run done (nothing deleted)"
else
  echo "clean done"
fi
