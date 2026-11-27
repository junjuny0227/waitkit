# Waitkit 로드맵

## 1.0 (완료)

- 결정(engine)과 실행(adapter) 분리: 규칙 매칭, 검증, 결과 결정은 `@waitkit/core` 한 곳에만 있고
  fetch·MSW 어댑터는 실행만 한다.
- 설정 형태 재정리: `error`/`timeout` 효과 묶음, rate 기본값 1, 경로 패턴 매처, `scenario` 용어 통일.
- 검증 단일화: `validateConfig`를 런타임과 CLI가 공유하고, 0.x 옵션은 대체 방법과 함께 안내한다.
- AbortSignal 존중, 재설정 시 이전 controller 자동 dispose(HMR 안전).
- React: controller 이벤트 기반 동기화, DevTools에 결과 종류(지연/에러/타임아웃) 표시.
- MSW 2·3 동시 지원, CLI `list`/`validate` 출력 개선.
- 툴체인: TypeScript 7, tsdown(+publint, attw), oxlint(type-aware), oxfmt, Vitest 5, pnpm 12, GitHub
  Actions CI.
- 라이선스 Apache-2.0 전환.

## 1.x 후보

- XHR 어댑터: `resolveOutcome`/`applyOutcome` 위에 추가한다.
- 네트워크 오류 시뮬레이션(`TypeError: Failed to fetch`)을 `error`와 별도 효과로 제공할지 검토.
- 응답 body 스트리밍 지연(첫 바이트 이후 느린 다운로드).
- MSW 어댑터에서도 controller 이벤트를 받을 수 있게 할지 검토.
- 예제 확장: Next.js, React Router, TanStack Query 재시도 UX.
- 브라우저 확장 또는 URL 쿼리로 시나리오를 고르는 방법.

## 결정 대기

- production 번들에 Waitkit이 포함됐을 때 core가 직접 경고할지, 문서의 환경 게이트 패턴으로 충분한지.
- delay 범위와 rate 결정에 서로 다른 random 시드를 쓰게 할지.
