# Waitkit commit scopes

| Changed area                                                                                              | Scope     |
| --------------------------------------------------------------------------------------------------------- | --------- |
| `packages/core/**`                                                                                        | `core`    |
| `packages/react/**`                                                                                       | `react`   |
| `packages/msw/**`                                                                                         | `msw`     |
| `packages/cli/**`                                                                                         | `cli`     |
| `apps/example/**`                                                                                         | `example` |
| `README.md`, `docs/**`, package `README.md` only                                                          | `docs`    |
| `.changeset/**`, `CHANGELOG.md`, version bumps                                                            | `release` |
| `package.json`, `pnpm-*.yaml`, `turbo.json`, `.ox*rc.json`, `packages/typescript-config/**`, `.vscode/**` | `tooling` |
| `.github/**`                                                                                              | `ci`      |
| `AGENTS.md`, `CLAUDE.md`, `.claude/**`                                                                    | `harness` |
| `ROADMAP.md`                                                                                              | `roadmap` |

Types: `feat` new capability, `fix` bug fix, `docs` docs only, `test` tests only, `refactor`
behavior-preserving restructuring, `chore` tooling, release, or harness, `ci` workflows.
