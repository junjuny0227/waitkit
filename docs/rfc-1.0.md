# RFC: Waitkit 1.0

- 상태: 확정 (Accepted), 구현 완료
- 확정일: 2026-11-27 — `결정 필요`였던 D1, D2, D4, D8, D11은 추천안으로 확정했다
- 작성일: 2026-11-27
- 대상 버전: `@waitkit/core`, `@waitkit/react`, `@waitkit/msw`, `@waitkit/cli` 모두 `1.0.0`
- 결정 범위: breaking change 허용. 0.x 사용자를 위한 마이그레이션 가이드를 함께 제공한다.

## 1. 배경

0.x는 기능 단위로 빠르게 확장되면서 다음 문제가 쌓였다. 근거의 파일:줄은 0.5.0 기준이다.

| #   | 문제                                                                                                                                                                                        | 근거                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| P1  | "요청을 어떻게 처리할지 결정"하는 로직이 fetch 패치 코드 안에 묶여 있어, MSW 어댑터가 응답 생성·기본 timeout을 복제했고 이미 동작이 갈라졌다 (Blob/FormData 가드, 응답 생성 실패 래핑 유무) | `core/src/setup-wait-kit.ts:45-96`, `msw/src/with-wait-kit.ts:6,38-78`, `core/src/response.ts` |
| P2  | 규칙 검증이 core와 CLI에 따로 있고, CLI에는 `url` 검증이 없다                                                                                                                               | `core/src/setup-wait-kit.ts:183-218`, `cli/src/commands/validate.ts:57-96`                     |
| P3  | `errorResponse`나 `timeoutMs`만 지정하면 rate가 없어서 아무 일도 일어나지 않는다 (실측: `errorResponse: { status: 503 }`만 둔 규칙 → 200 통과)                                              | `core/src/setup-wait-kit.ts:74,85`, `core/src/delay.ts:65-75`                                  |
| P4  | 문자열 matcher가 substring이라 `'/api/user'`가 `/api/users`, `/api/user-settings`에도 걸린다 (실측)                                                                                         | `core/src/matcher.ts:8-10`, `core/src/types.ts:3-7`                                            |
| P5  | 이벤트 구독 경로가 옵션 콜백 6개와 `addEventListener` 두 갈래다                                                                                                                             | `core/src/types.ts:61-66,91-94`                                                                |
| P6  | `restore` 이후 `enable`하면 다시 패치된다. "복원"이 종료가 아니라 일시정지에 가깝다 (실측)                                                                                                  | `core/src/setup-wait-kit.ts:109-127`                                                           |
| P7  | 같은 개념을 core는 `activeScenario`, CLI config는 `defaultScenario`라 부르고, CLI config는 런타임에 그대로 넘길 수 없다                                                                     | `core/src/types.ts:59`, `cli/src/config/types.ts:6`                                            |
| P8  | React store는 자신을 거친 호출에만 반응해, controller를 직접 조작하면 화면 상태가 낡는다                                                                                                    | `react/src/wait-kit-store.ts:42-76`                                                            |
| P9  | React Provider의 `scenarioNames` prop이 controller가 이미 아는 정보를 중복으로 받는다                                                                                                       | `react/src/wait-kit-provider.tsx:15-18`                                                        |
| P10 | 랜덤 결정이 `Math.random`에 고정되어 테스트가 전역 모킹에 의존한다                                                                                                                          | `core/src/delay.ts:13,74`, 각 테스트의 `vi.spyOn(Math, 'random')`                              |

## 2. 목표와 비목표

**목표**

- 결정(engine)과 실행(adapter)을 분리해 정책이 한 곳에만 존재하게 한다.
- 설정 하나(`WaitKitConfig`)를 core 런타임, CLI 검증, MSW가 같이 쓴다.
- "적으면 동작한다": 의미 없는 설정 조합(P3)을 타입과 기본값으로 없앤다.
- 결정적 테스트가 가능하도록 랜덤 소스를 주입할 수 있게 한다.

**비목표 (1.0 이후 후보로 남김)**

- XHR 어댑터, 네트워크 오류(`TypeError: Failed to fetch`) 시뮬레이션, 응답 body 스트리밍 지연
- MSW 어댑터에서의 이벤트 발행
- DevTools UI 재디자인

## 3. 아키텍처

```text
@waitkit/core
├─ config     WaitKitConfig 타입, defineConfig, validateConfig → ValidationIssue[]
├─ engine     순수 결정: selectRule(rules, request) / resolveOutcome(effects, { random })
├─ response   createSimulatedResponse (engine이 사용)
└─ fetch      setupWaitKit: globalThis.fetch 패치 + 이벤트 + controller (engine 호출만)

@waitkit/msw    withWaitKit(effects, resolver)  → engine.resolveOutcome 실행
@waitkit/cli    validate/list/init               → core.validateConfig, core.defineConfig
@waitkit/react  Provider/hooks/DevTools          → controller.on('change') 구독
```

원칙: `engine`은 타이머·전역 상태·이벤트를 모른다. 기다리고(throw/return) 이벤트를 쏘는 것은 어댑터 몫이다.
이렇게 하면 XHR 같은 새 어댑터를 붙여도 정책(어떤 규칙이 걸리고 결과가 무엇인지)은 한 곳에만 남는다.

```ts
type Outcome =
  | { kind: 'passthrough'; delayMs: number }
  | { kind: 'error'; delayMs: number; response: Response }
  | { kind: 'timeout'; delayMs: number; timeoutMs: number };

function resolveOutcome(effects: WaitKitEffects, options?: { random?: () => number }): Outcome;
```

MSW v2 resolver는 표준 `Response` 반환을 허용하므로 `HttpResponse` 전용 생성 코드는 필요 없다 (Phase 3에서 msw 3 포함 재확인).

## 4. 결정 사항

각 항목은 채택안과 기각한 대안을 함께 둔다.

### D1. Rule 모양: 효과를 묶고 rate 기본값을 1로 — 확정

```ts
interface WaitKitRule extends WaitKitEffects {
  url: UrlMatcher;
  method?: HttpMethod | readonly HttpMethod[];
}

interface WaitKitEffects {
  delay?: DelayValue;
  error?: {
    rate?: number; // 기본 1
    status?: number; // 기본 500
    statusText?: string;
    headers?: HeadersInit;
    body?: unknown;
  };
  timeout?: {
    rate?: number; // 기본 1
    ms?: number; // 기본 30_000
  };
}
```

- 근거: P3 해소. `error: { status: 503 }`라고 쓰면 그대로 503이 난다. rate는 "가끔 실패"가 필요할 때만 적는다.
- 평가 순서는 유지: delay → timeout → error → passthrough.
- 대안: 평평한 필드 유지 + rate 기본값만 바꾸기. 필드 이름(`errorRate`/`errorResponse`)이 관계를 드러내지 못해 기각.

### D2. 문자열 matcher: substring → 경로 패턴 — 확정

- 추천: 문자열은 **pathname 전체 일치** 패턴. `:param` 한 세그먼트, `*` 나머지 전체를 지원한다.
  `'/api/users/:id'`, `'/api/*'`. 쿼리스트링은 무시한다.
- 상대 URL(`fetch('/api/users')`)은 `globalThis.location?.href`, 없으면 `http://localhost` 기준으로 해석한다.
- substring이나 호스트 매칭이 필요하면 RegExp 또는 함수를 쓴다 (기존과 동일).
- 구현: 내부 소형 매처. 브라우저·Node 24+에는 전역 `URLPattern`이 있지만 CI 대상인 Node 22에서의 제공 여부를 Phase 1에서 확인하기 전까지는 의존하지 않는다.
- 대안: substring 유지 + 문서화. 실측된 오매칭(P4)을 남기는 것이라 기각.

### D3. 이벤트: `controller.on()` 하나로 — 확정

- 옵션 콜백(`onRequest` 등 6개)과 `addEventListener`를 제거하고 `controller.on(type, listener): () => void` 하나만 둔다.
- 이벤트: `request`, `match`, `delayStart`, `delayEnd`, `error`, `change`.
  `scenarioChange`는 `change`로 확장: `{ previous: WaitKitState; current: WaitKitState; reason }`
  (`WaitKitState = { enabled; scenario }`), enable/disable도 여기로 발행한다. React 동기화(P8)가 이 이벤트 하나로 끝난다.
- 근거: P5. listener는 `setupWaitKit` 직후 동기적으로 붙일 수 있어 setup 시점 콜백이 따로 필요 없다.
- 이름: `addEventListener`는 DOM의 `removeEventListener` 짝을 연상시키는데 실제로는 해제 함수를 반환하므로 `on`이 실제 계약에 맞다.

### D4. Controller 수명: `restore` → 종료형 `dispose` — 확정

- 추천: `enable()` / `disable()`은 일시정지 토글로 유지. `restore()`를 `dispose()`로 바꾸고 **종료 상태**로 만든다. dispose 이후 `enable()`은 에러.
  `[Symbol.dispose]`(`using` 지원)는 소비자 TS lib 설정에 따라 타입 오류를 낼 수 있어 1.0에서는 제외했다.
- 근거: P6. 현재 DevTools의 Restore 버튼 뒤에 Enabled를 누르면 다시 패치되는 등 사용자가 상태를 예측하기 어렵다.
- 대안: 현행 유지(재활성 가능). 테스트에서 매 케이스마다 `setupWaitKit`을 다시 부르는 패턴이 이미 일반적이라 재활성의 실익이 작다.

### D5. 시나리오와 config 통합 — 확정

- 옵션 이름을 `scenario`로 통일 (`activeScenario`, `defaultScenario` 둘 다 대체).
- `WaitKitConfig`와 `defineConfig`를 core로 옮기고 `setupWaitKit(config, runtimeOptions?)`가 그대로 받는다.
  `waitkit.config.ts`를 앱에서 import해 넘기면 CLI가 검증한 그 파일이 곧 런타임 입력이 된다 (P7).
- `rules`(기본)와 `scenarios[name]`의 관계는 현행대로 **대체**. 병합은 도입하지 않는다.

```ts
// waitkit.config.ts
import { defineConfig } from '@waitkit/core';
export default defineConfig({
  scenario: 'slow-network',
  scenarios: { 'slow-network': [{ url: '/api/*', delay: 2000 }] },
});

// app
import config from './waitkit.config';
const controller = setupWaitKit(config, { enabled: import.meta.env.DEV });
```

### D6. 검증: `validateConfig` 단일 진입점 — 확정

- `validateConfig(config): ValidationIssue[]` (`{ path: 'scenarios.slow[0].error.rate'; message }`)를 core에서 export.
- `setupWaitKit`은 이슈가 있으면 모든 이슈를 담은 에러 하나를 throw. CLI는 같은 배열을 출력한다 (P2).
- 개별 `validateDelay`/`validateRate`/`validateTimeoutMs` export는 제거 (0.5.0에서 CLI 전용으로 추가된 것).
- `url` 누락·타입 오류, `method` 값 검증을 추가한다.

### D7. 랜덤 소스 주입 — 확정

- `setupWaitKit(config, { random })`, `resolveOutcome(effects, { random })`. 기본 `Math.random`.
- 근거: P10, `.claude/rules/core-api-conventions.md`의 "Random delay, error, and timeout behavior must be testable".

### D8. AbortSignal 존중 — 확정

- 추천: delay와 timeout 대기 중 요청의 `signal`이 abort되면 즉시 `signal.reason`으로 reject한다 (실제 fetch와 동일).
- 근거: React Query, SWR 등의 취소 흐름을 Waitkit으로 테스트할 수 있어야 한다. 현재는 의도적으로 무시한다 (`core/tests/setup-wait-kit.test.ts:151`).
- 대안: 현행 유지. 취소 UX 테스트가 불가능해지므로 비추천.

### D9. MSW — 확정

- `withWaitKit(effects: WaitKitEffects, resolver)`. `WaitKitMswRule`은 `WaitKitEffects`로 대체.
- peer 범위는 Phase 1의 msw 3 마이그레이션 검토 결과로 정한다 (현재 `>=2.0.0`은 검증 없이 v3까지 허용 중).
- 내부는 `resolveOutcome` 실행만 남기고 응답 생성·기본값 복제를 삭제 (P1).

### D10. React — 확정

- `WaitKitProvider`의 `scenarioNames` prop 제거 (P9). controller에서 읽는다.
- store는 `controller.on('change')`를 구독한다 (P8). 자체 notify 경로는 제거.
- `useWaitKit().restore` → `dispose` (D4 연동).

### D11. 패키징과 런타임 지원 — 확정

- 추천: 라이브러리 3종은 ESM/CJS 이중 빌드 유지 (Jest 등 CJS 소비자 비용이 아직 크다), CLI는 현행 유지.
- `engines.node`: 개발 툴체인이 이미 `>=20.19`를 요구하고 Node 20은 EOL이므로 CLI는 `>=22`.
  라이브러리는 브라우저가 주 대상이므로 `engines`를 두되 "Node 테스트 환경 공식 지원 = 22 이상"으로 문서화.
- 빌드 도구(tsup 9 / tsdown)는 Phase 1에서 결정.

## 5. 마이그레이션 표 (0.x → 1.0)

| 0.x                                                    | 1.0                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `{ errorRate: 0.3, errorResponse: { status: 503 } }`   | `{ error: { rate: 0.3, status: 503 } }`                                                                       |
| `{ errorRate: 1 }`                                     | `{ error: {} }`                                                                                               |
| `{ timeoutRate: 1, timeoutMs: 3000 }`                  | `{ timeout: { ms: 3000 } }`                                                                                   |
| `url: '/api/users'` (substring)                        | `url: '/api/users'` (정확 일치) 또는 `url: '/api/users*'`. 기존 동작은 `url: (u) => u.includes('/api/users')` |
| `activeScenario` / `defaultScenario`                   | `scenario`                                                                                                    |
| `onMatch: fn` 등 옵션 콜백                             | `controller.on('match', fn)`                                                                                  |
| `controller.addEventListener(t, fn)`                   | `controller.on(t, fn)`                                                                                        |
| `scenarioChange` 이벤트                                | `change` 이벤트 (`previous`/`current` 상태)                                                                   |
| `controller.restore()` (재활성 가능)                   | `controller.dispose()` (종료)                                                                                 |
| `import { defineConfig } from '@waitkit/cli'`          | `import { defineConfig } from '@waitkit/core'`                                                                |
| `validateDelay` / `validateRate` / `validateTimeoutMs` | `validateConfig`                                                                                              |
| `WaitKitMswRule`                                       | `WaitKitEffects`                                                                                              |
| `<WaitKitProvider scenarioNames={...}>`                | prop 제거                                                                                                     |
| abort 무시                                             | abort 시 `signal.reason`으로 reject                                                                           |

## 6. 구현 결과와 RFC 대비 차이

- 구현은 이 RFC의 아키텍처를 따른다: `packages/core/src/{config,matcher,outcome,setup-wait-kit}.ts`.
- 추가: `isWaitKitConfig`(type guard), `validateEffects`(MSW 어댑터 검증 공유), `useWaitKitEvent`.
- MSW 어댑터는 msw 타입(`HttpResponseResolver`)을 type-only로 import해 resolver 인자 추론을 유지한다.
  msw 2·3 모두 루트에서 해당 타입을 export한다.
- 마이그레이션 가이드: `docs/migration-1.0.md`.

## 7. 열린 질문

- production 빌드에 Waitkit이 섞였을 때 경고나 차단을 core가 직접 해야 하는가, 문서의 환경 게이트 패턴으로 충분한가.
- `delay` 범위 결정에도 `random`을 쓰는데, 사용자가 delay와 error 결정을 서로 다른 시드로 분리하길 원할지.
- 1.0 이후 0.x 라인에 보안·버그 수정 백포트를 할지 (현재 사용자 규모 기준으로는 불필요하다고 판단).
