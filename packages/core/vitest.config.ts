import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: {
    environment: 'node',
    restoreMocks: true,
  },
});

export default config;
