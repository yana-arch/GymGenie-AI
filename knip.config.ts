import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'index.tsx',
    'App.tsx',
    'vite.config.ts',
    'vitest.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
  ],
  project: [
    '**/*.ts',
    '**/*.tsx',
  ],
  ignore: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
  ignoreDependencies: [],
  ignoreExportsUsedInFile: true,
};

export default config;
