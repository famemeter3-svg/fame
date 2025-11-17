/**
 * Jest Configuration for Taiwan Celebrity Tracker
 * Used for backend integration tests
 */

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/*.integration.test.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/dist/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.js'],
  globalTeardown: '<rootDir>/tests/setup/jest-teardown.js',
  testTimeout: 30000,
  verbose: true,
  maxWorkers: '50%', // Use 50% of available CPU for parallelization
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/backend/$1',
  },
  transformIgnorePatterns: ['/node_modules/'],
  bail: false, // Continue running tests even if some fail
  detectOpenHandles: true, // Detect open handles that prevent clean shutdown
  forceExit: false, // Don't force exit, let tests clean up properly
  passWithNoTests: false,
};
