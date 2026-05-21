# Waitkit Roadmap

Waitkit은 프론트엔드 개발 중 loading, skeleton, error, timeout, retry 상태를
의도적으로 테스트하기 위한 개발용 네트워크 시뮬레이션 도구입니다.

이 문서는 앞으로 개발할 항목을 우선순위별로 정리합니다.

## 현재 상태

- `@waitkit/core`
  - `fetch` 인터셉션 기반 네트워크 시뮬레이션
  - URL/method 매칭
  - delay, error response, timeout
  - named scenario 전환
  - enable/disable/restore controller API
  - 기본 이벤트 콜백
- Changesets 기반 릴리즈 준비
- 루트 README와 core 패키지 README 분리

## P0: 첫 배포 안정화

- npm 배포 권한 정리
  - `@waitkit` npm organization 또는 scope 확보
  - `@waitkit/core@0.1.0` 첫 배포
- 배포 후 설치 검증
  - 새 임시 프로젝트에서 `@waitkit/core` 설치
  - ESM/CJS import 동작 확인
  - 타입 선언 동작 확인
- README 검증
  - 설치 명령어 확인
  - 기본 사용 예제가 실제로 동작하는지 확인
  - npm 패키지 페이지에 표시되는 README 확인

## P1: Core 개선

- rule matching 확장
  - query string 포함/제외 매칭 정책 정리
  - predicate matcher 예제 보강
  - rule 우선순위 문서화
- response simulation 개선
  - JSON/body/header 처리 케이스 보강
  - status text 기본값 정리
  - `Response` 생성 실패 가능성이 있는 입력 방어
- timeout/error 동작 정리
  - timeout error 형태를 문서화
  - abort signal과 timeout 시뮬레이션이 함께 있을 때의 동작 검증
- event API 정리
  - request lifecycle 이벤트 이름 재검토
  - scenario 변경 이벤트 추가 여부 검토
  - 디버깅용 event payload 보강
- 테스트 보강
  - 랜덤 delay/errorRate/timeoutRate 결정 로직
  - 복수 rule 충돌 케이스
  - restore 후 원본 `fetch` 복원 보장

## P2: React 패키지

- `@waitkit/react` 패키지 추가
  - `WaitKitProvider`
  - `useWaitKit`
  - scenario 선택/초기화 hook
- 개발용 컨트롤 패널
  - 현재 scenario 표시
  - scenario 전환
  - enable/disable toggle
  - 최근 match/request 로그 표시
- React 예제 앱 추가
  - loading/skeleton/error/timeout 상태를 한 화면에서 확인할 수 있는 샘플

## P3: MSW 연동

- `@waitkit/msw` 패키지 추가
  - MSW handler와 Waitkit scenario를 연결하는 API 설계
  - 기존 MSW mock 응답에 delay/error/timeout 시뮬레이션을 얹는 방식 검토
- MSW 사용자를 위한 문서 추가
  - Waitkit 단독 사용과 MSW 연동 사용의 차이 정리
  - 추천 사용 패턴 예제 작성

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
- devtools UI를 `@waitkit/react`에 포함할지 별도 패키지로 분리할지
- `fetch` 외에 XHR 지원이 필요한지
- 브라우저 전용으로 유지할지 Node 테스트 환경까지 공식 지원할지
