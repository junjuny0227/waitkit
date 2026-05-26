# Waitkit Roadmap

Waitkit은 프론트엔드 개발 중 loading, skeleton, error, timeout, retry 상태를
의도적으로 테스트하기 위한 개발용 네트워크 시뮬레이션 도구입니다.

이 문서는 앞으로 개발할 항목을 우선순위별로 정리합니다.

## 현재 상태

- `@waitkit/core@0.3.0` npm 배포 완료
  - `fetch` 인터셉션 기반 네트워크 시뮬레이션
  - URL/method 매칭, delay, error response, timeout
  - named scenario 전환
  - enable/disable/restore controller API
  - 인라인 이벤트 콜백 (`onRequest`, `onMatch`, `onDelayStart`, `onDelayEnd`, `onError`, `onScenarioChange`)
  - `addEventListener` 동적 이벤트 구독 API (언서브스크라이브 함수 반환)
- `@waitkit/react@0.3.0` npm 배포 완료
  - `WaitKitProvider` / `useWaitKit` / `useWaitKitScenario`
  - `WaitKitDevTools` 개발용 플로팅 패널 (enabled 상태, scenario 전환, 실시간 요청 로그)
- `@waitkit/msw@0.1.1` npm 배포 완료
  - MSW v2 handler에 delay/error/timeout 시뮬레이션을 적용하는 `withWaitKit(rule, resolver)` API
  - `WaitKitMswRule` 타입 (url/method 제외한 rule 부분 타입)
  - `globalThis.fetch` 패치 없이 MSW resolver 레이어에서 동작
- Vite + React + Tailwind v4 예제 앱 (`apps/example`) 추가
- P0 ~ P3 완료

## P0: 첫 배포 안정화 완료

- npm 배포 완료
  - `@waitkit` npm scope 사용
  - `@waitkit/core@0.1.1` 배포 완료
- 배포 후 설치 검증 완료
  - 새 임시 프로젝트에서 `@waitkit/core` 설치 확인
  - ESM/CJS import 동작 확인
  - 타입 선언 동작 확인
- README 검증
  - 설치 명령어 확인
  - 기본 사용 예제의 외부 앱 적용 및 타입 확인 완료
  - 실제 API 요청을 통한 `fetch` 인터셉션 동작 확인 완료
  - npm 패키지 페이지에 표시되는 README 확인 완료

## P1: Core 개선 완료

- 실행 순서
  - rule matching 문서화/테스트 완료
  - response simulation 보강 완료
  - timeout/error 동작 정리 완료
  - event API 문서화 완료
- rule matching 확장
  - query string 포함/제외 매칭 정책 정리 완료
  - predicate matcher 예제 보강 완료
  - rule 우선순위 문서화 완료
- response simulation 개선
  - JSON/body/header 처리 케이스 보강 완료
  - status text 기본값 정리 완료
  - `Response` 생성 실패 가능성이 있는 입력 방어 완료
- timeout/error 동작 정리
  - timeout error 형태 문서화 완료
  - abort signal과 timeout 시뮬레이션이 함께 있을 때의 동작 검증 완료
- event API 정리
  - request lifecycle 이벤트 이름 유지 결정 완료
  - scenario 변경 이벤트 추가 완료
  - 디버깅용 event payload 보강 완료
- 테스트 보강
  - 랜덤 delay/errorRate/timeoutRate 결정 로직 보강 완료
  - 복수 rule 충돌 케이스 보강 완료
  - restore 후 원본 `fetch` 복원 보장 보강 완료

## P2: React 패키지 완료

- `@waitkit/react` 패키지 추가 완료
  - `WaitKitProvider` 추가 완료
  - `useWaitKit` 추가 완료
  - `useWaitKitScenario` 추가 완료
- 개발용 컨트롤 패널 완료 (`WaitKitDevTools`)
  - 현재 scenario 표시 완료
  - scenario 전환 완료
  - enable/disable toggle 완료
  - 최근 match/error 요청 로그 표시 완료 (스크롤, 말줄임 처리)
- React 예제 앱 추가 완료 (`apps/example`)
  - JSONPlaceholder 기반 3개 API 카드 (Users, Posts, Todos)
  - slow-network / server-error / timeout / 기본 시나리오 전환 데모
- `addEventListener` 동적 이벤트 구독 API 추가 완료 (`@waitkit/core@0.3.0`)

## P3: MSW 연동 완료

- `@waitkit/msw` 패키지 추가 완료
  - `withWaitKit(rule, resolver)`: MSW resolver를 감싸는 HOF, delay → timeoutRate → errorRate 순서로 평가 완료
  - `WaitKitMswRule` 타입 추가 완료 (url/method 제외한 WaitKitRule 부분 타입)
  - msw v2 peerDependency, ESM/CJS 이중 빌드 완료
- MSW 사용자를 위한 문서 추가 완료
  - `withWaitKit` 사용법, 실행 순서, timeout 동작, `server.use()` 연동 패턴 문서화 완료

## P4: CLI와 개발 워크플로우

- `@waitkit/cli` 패키지 추가 검토
  - scenario 파일 생성
  - scenario 목록 출력
  - 설정 파일 검증
- config 파일 지원 검토
  - `waitkit.config.ts`
  - scenario를 코드 밖에서 관리하는 방식
- 로컬 개발 워크플로우 문서화
  - 앱별로 Waitkit을 조건부 로드하는 패턴
  - 팀 단위 scenario 공유 방식

## 문서와 예제

- `@waitkit/core` API reference 보강
- Vite, Next.js, React Router 예제 추가 검토
- loading/skeleton/error/timeout/retry UX 테스트 가이드 작성
- npm 배포 후 README badge 추가 검토

## 나중에 결정할 것

- minified build 제공 여부
- sourcemap 유지 여부
- `fetch` 외에 XHR 지원이 필요한지
- 브라우저 전용으로 유지할지 Node 테스트 환경까지 공식 지원할지
