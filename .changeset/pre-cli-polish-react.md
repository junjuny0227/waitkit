---
'@waitkit/react': minor
---

`WaitKitProvider`가 `scenarioNames` prop 없이도 `controller.getScenarioNames()`를 통해 시나리오 목록을 자동으로 파생합니다. 기존 `scenarioNames` prop은 명시적 override로 그대로 사용 가능합니다.

`WaitKitDevTools`에 Restore 버튼을 추가했습니다. 클릭 시 `controller.restore()`를 호출해 원본 fetch를 복원합니다.
