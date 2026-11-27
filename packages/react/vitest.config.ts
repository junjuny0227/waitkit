import { defineConfig, type ViteUserConfig } from 'vitest/config';

const config: ViteUserConfig = defineConfig({
  test: {
    environment: 'jsdom',
    restoreMocks: true,
  },
});

export default config;
