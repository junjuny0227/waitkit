# Waitkit Claude Harness Changelog

| Date       | Change                                   | Target                                          | Reason                                                                 |
| ---------- | ---------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-05-21 | Adapted copied harness for Waitkit       | `CLAUDE.md`, `.claude/agents`, `.claude/skills` | Replace app-specific frontend assumptions with library monorepo roles. |
| 2026-05-21 | Replaced app rules with package rules    | `.claude/rules`                                 | Align reviews with core API, package boundaries, and releases.         |
| 2026-05-21 | Updated settings, hooks, and git scopes  | `.claude/settings.json`, `.claude/hooks`        | Use existing Waitkit commands and block publish side effects.          |
| 2026-05-21 | Updated commit, PR, and review workflows | `.claude/skills`                                | Keep GitHub automation generic and Waitkit-specific.                   |
