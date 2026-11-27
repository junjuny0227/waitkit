# CLAUDE.md

@AGENTS.md

## Claude Code harness

Repository-wide instructions live in `AGENTS.md` (imported above) so every agent reads the same
text. This section only covers what is specific to Claude Code.

- **Path-scoped rules** in `.claude/rules/` load when matching files are touched:
  `package-architecture.md`, `core-api-conventions.md`, `release-workflow.md`,
  `git-workflow.md`.
- **Skills** in `.claude/skills/`:
  - `quality-gate`: run and report the gate before saying work is done.
  - `code-review`: review a diff against the rules, findings first.
  - `release-docs`: changesets, package READMEs, migration notes, release prep.
  - `commit`, `write-pr`, `review-pr`: Git and GitHub side effects, used only when the user asks
    for that step.
- **Hooks** (`.claude/settings.json`): `preToolUse.sh` logs Bash commands to
  `.claude/command.log` (gitignored) and blocks destructive commands and publishing;
  `postToolUse.sh` reminds you of the gate after edits.
- Harness changes are recorded in `.claude/CHANGELOG.md`.
