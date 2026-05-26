# @waitkit/msw

MSW handler에 [Waitkit](https://github.com/junjuny0227/waitkit) delay/error/timeout 시뮬레이션을 추가합니다.

## 요구사항

- msw **v2 이상**
- @waitkit/core **v0.3 이상** (자동 설치됨)

## 설치

```bash
npm install @waitkit/msw
# 또는
pnpm add @waitkit/msw
```

## 사용법

### `withWaitKit(rule, resolver)`

MSW resolver를 감싸는 고차 함수입니다. resolver 실행 전에 delay/error/timeout을 적용합니다.

```typescript
import { http, HttpResponse } from 'msw';
import { withWaitKit } from '@waitkit/msw';

export const handlers = [
  // 1.5초 delay 후 응답
  http.get(
    '/api/users',
    withWaitKit({ delay: 1500 }, () => HttpResponse.json([{ id: 1, name: 'Alice' }])),
  ),

  // 30% 확률로 500 에러
  http.post(
    '/api/orders',
    withWaitKit(
      { errorRate: 0.3, errorResponse: { status: 500, body: { message: 'Server Error' } } },
      async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({ id: 99, ...body });
      },
    ),
  ),

  // 항상 3초 후 timeout
  http.get(
    '/api/slow',
    withWaitKit({ timeoutRate: 1, timeoutMs: 3000 }, () => HttpResponse.json({})),
  ),
];
```

### `WaitKitMswRule`

`url`과 `method`를 제외한 Waitkit rule 타입입니다. MSW handler가 이미 URL/method를 알고 있으므로 필요하지 않습니다.

```typescript
import type { WaitKitMswRule } from '@waitkit/msw';

const slowRule: WaitKitMswRule = {
  delay: [800, 2000], // 범위 delay (ms)
  errorRate: 0.2, // 에러 발생 확률 (0~1)
  errorResponse: {
    status: 503,
    body: { message: 'Unavailable' },
  },
  timeoutRate: 0, // timeout 발생 확률 (0~1)
  timeoutMs: 5000, // timeout 시간 (ms, 기본값 30000)
};
```

### MSW 시나리오와 함께 사용

MSW의 `server.use()`로 시나리오를 전환할 수 있습니다.

```typescript
import { server } from './msw-server';
import { http, HttpResponse } from 'msw';
import { withWaitKit } from '@waitkit/msw';

// slow-network 시나리오 활성화
server.use(
  http.get(
    '/api/*',
    withWaitKit(
      { delay: 2000 },
      ({ request }) => fetch(request), // 실제 요청 통과
    ),
  ),
);

// 원래 handler로 복구
server.resetHandlers();
```

## timeout 동작

`timeoutRate`가 발동되면 `WaitKitTimeoutError`가 throw됩니다. MSW는 이를 네트워크 에러로 처리합니다.

```typescript
import { WaitKitTimeoutError } from '@waitkit/core';

try {
  await fetch('/api/slow');
} catch (error) {
  if (error instanceof WaitKitTimeoutError) {
    console.log('timeout!');
  }
}
```

## 실행 순서

한 번의 요청에서 rule 옵션은 다음 순서로 평가됩니다.

1. **delay** — resolver 호출 전에 대기
2. **timeoutRate** — 해당하면 `WaitKitTimeoutError` throw
3. **errorRate** — 해당하면 `errorResponse` 기반 Response 반환
4. resolver 호출

## 라이선스

MIT
