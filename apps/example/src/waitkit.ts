import { setupWaitKit } from '@waitkit/core';

export const SCENARIO_NAMES = ['slow-network', 'server-error', 'timeout'] as const;

export const controller = setupWaitKit({
  scenarios: {
    'slow-network': [{ url: /\/api\//, delay: 2000 }],
    'server-error': [
      {
        url: /\/api\//,
        errorRate: 1,
        errorResponse: { status: 500, body: { message: 'Internal Server Error' } },
      },
    ],
    timeout: [{ url: /\/api\//, timeoutRate: 1, timeoutMs: 3000 }],
  },
});
