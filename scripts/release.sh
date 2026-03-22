#!/usr/bin/env bash
# release.sh — Strip CLASI development artifacts for student distribution.
# Idempotent: safe to run even if some items are already gone.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

removed=()

remove_if_exists() {
    local target="$1"
    if [ -e "$target" ]; then
        rm -rf "$target"
        removed+=("$target")
    fi
}

# 1. Delete the entire docs/clasi/ directory
remove_if_exists "docs/clasi"

# 2. Delete .mcp.json
remove_if_exists ".mcp.json"

# 3. Delete .vscode/mcp.json
remove_if_exists ".vscode/mcp.json"

# 4. Delete .claude/rules/ directory
remove_if_exists ".claude/rules"

# 5. Delete .claude/settings.json and .claude/settings.local.json
remove_if_exists ".claude/settings.json"
remove_if_exists ".claude/settings.local.json"

# 6. Keep .claude/skills/ (useful for students) — no action needed

# 7. Strip the CLASI:START through CLASI:END block from CLAUDE.md
if [ -f "CLAUDE.md" ]; then
    if grep -q '<!-- CLASI:START -->' CLAUDE.md; then
        sed -i '' '/<!-- CLASI:START -->/,/<!-- CLASI:END -->/d' CLAUDE.md
        removed+=("CLAUDE.md CLASI block")
    fi
fi

# 8. Delete docs/inital_planning/ directory
remove_if_exists "docs/inital_planning"

# 9. Delete docs/ directory if empty after removals
if [ -d "docs" ] && [ -z "$(ls -A docs)" ]; then
    rmdir "docs"
    removed+=("docs (empty)")
fi

# 10. Print what was removed
echo "=== Release cleanup complete ==="
if [ ${#removed[@]} -eq 0 ]; then
    echo "Nothing to remove — already clean."
else
    echo "Removed:"
    for item in "${removed[@]}"; do
        echo "  - $item"
    done
fi
