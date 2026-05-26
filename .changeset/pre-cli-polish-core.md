---
'@waitkit/core': minor
---

`delayStart`/`delayEnd` 이벤트를 `addEventListener`로 구독할 수 있도록 `WaitKitEventMap`에 추가했습니다.

`WaitKitController`에 `getScenarioNames(): readonly string[]` 메서드를 추가했습니다. `setupWaitKit`에 전달한 시나리오 이름 목록을 반환합니다.

`resolveDelay`, `sleep`, `shouldTrigger` 유틸리티 함수를 공개 API로 export합니다.

`UrlMatcher` 타입에 string 매처가 substring 포함 여부로 동작함을 문서화했습니다.
