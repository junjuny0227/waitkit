# waitkit

Development-only network simulation tools for intentionally testing loading,
skeleton, error, timeout, and retry states.

## MVP

The first package is `@waitkit/core`, a fetch interceptor that applies rules or
named scenarios to matching requests.

```ts
import { setupWaitKit } from "@waitkit/core";

const waitkit = setupWaitKit({
  enabled: import.meta.env.DEV,
  activeScenario: "slow-network",
  scenarios: {
    "slow-network": [
      { url: "/api/users", method: "GET", delay: [800, 2000] },
    ],
    "server-error": [
      {
        url: "/api/payment",
        method: "POST",
        delay: 500,
        errorRate: 1,
        errorResponse: {
          status: 500,
          body: { message: "Payment failed" },
        },
      },
    ],
    timeout: [{ url: "/api/report", timeoutRate: 1, timeoutMs: 5000 }],
  },
});

waitkit.setScenario("server-error");
waitkit.disable();
waitkit.restore();
```
