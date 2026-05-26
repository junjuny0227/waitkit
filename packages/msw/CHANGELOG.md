# @waitkit/msw

## 0.1.1

### Patch Changes

- Update README to English to match other Waitkit packages.

## 0.1.0

### Minor Changes

- f129716: `@waitkit/msw` 패키지 추가

  MSW v2 handler에 Waitkit delay/error/timeout 시뮬레이션을 적용하는 `withWaitKit(rule, resolver)` API를 제공합니다.
  - `withWaitKit`: MSW resolver를 감싸는 고차 함수. delay → timeoutRate → errorRate 순서로 rule을 평가합니다.
  - `WaitKitMswRule`: url/method를 제외한 Waitkit rule 부분 타입.
