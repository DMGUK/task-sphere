import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/__tests__/testEnv.ts'],
  maxWorkers: 1,
  testTimeout: 15000,
};

export default config;
