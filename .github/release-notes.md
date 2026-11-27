All Waitkit packages share one version. They are published to npm when this release is published, with provenance from this repository's `publish.yml` workflow.

| Package          | npm                                                                         | Changelog                                                                                         |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `@waitkit/core`  | [`{{VERSION}}`](https://www.npmjs.com/package/@waitkit/core/v/{{VERSION}})  | [CHANGELOG](https://github.com/junjuny0227/waitkit/blob/v{{VERSION}}/packages/core/CHANGELOG.md)  |
| `@waitkit/react` | [`{{VERSION}}`](https://www.npmjs.com/package/@waitkit/react/v/{{VERSION}}) | [CHANGELOG](https://github.com/junjuny0227/waitkit/blob/v{{VERSION}}/packages/react/CHANGELOG.md) |
| `@waitkit/msw`   | [`{{VERSION}}`](https://www.npmjs.com/package/@waitkit/msw/v/{{VERSION}})   | [CHANGELOG](https://github.com/junjuny0227/waitkit/blob/v{{VERSION}}/packages/msw/CHANGELOG.md)   |
| `@waitkit/cli`   | [`{{VERSION}}`](https://www.npmjs.com/package/@waitkit/cli/v/{{VERSION}})   | [CHANGELOG](https://github.com/junjuny0227/waitkit/blob/v{{VERSION}}/packages/cli/CHANGELOG.md)   |

```sh
pnpm add -D @waitkit/core@{{VERSION}} @waitkit/react@{{VERSION}}
```
