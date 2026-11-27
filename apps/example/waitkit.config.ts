import { defineConfig } from '@waitkit/core';

// Shared by the app (src/waitkit.ts) and the CLI: `pnpm exec waitkit list` from this folder.
export default defineConfig({
  scenarios: {
    'slow-network': [{ url: '/api/*', delay: [1500, 2500] }],
    'server-error': [
      { url: '/api/*', error: { status: 500, body: { message: 'Internal Server Error' } } },
    ],
    flaky: [{ url: '/api/*', error: { rate: 0.5, status: 503, body: { message: 'Try again' } } }],
    timeout: [{ url: '/api/*', timeout: { ms: 3000 } }],
    'slow-users': [{ url: '/api/users', delay: 3000 }],
  },
});
