#!/bin/bash
# Reminds the agent to run the gate after editing source, docs, or config.

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

case "$FILE_PATH" in
  *.ts | *.tsx | *.md | *.json | *.yaml | *.yml)
    echo "[Waitkit Hook] Edited $(basename "$FILE_PATH"). Run 'pnpm check' (or the quality-gate skill) before reporting the work as done." >&2
    ;;
esac

exit 0
