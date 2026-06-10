import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transform: {
    '^.+\\.(ts|mts|js|mjs|cjs|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@angular|@angular/cdk|rxjs|tslib|zone\\.js)/)',
  ],
  moduleNameMapper: {
    '^@angular/cdk/drag-drop$': '<rootDir>/src/__mocks__/@angular/cdk/drag-drop.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
