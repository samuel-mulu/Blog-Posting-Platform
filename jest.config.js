module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: "ts-jest",

  // Test environment (node for backend)
  testEnvironment: "node",

  // Root directory for tests
  roots: ["<rootDir>/tests"],

  // Test file patterns
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],

  // Module file extensions
  moduleFileExtensions: ["ts", "js", "json"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/generated/**",
    "!src/server.ts", // Exclude main entry file
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // Transform files with ts-jest
  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  // Module name mapper for path aliases (if needed)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // Verbose output
  verbose: true,

  // Detect open handles (helps find async issues)
  detectOpenHandles: true,

  // Force exit after tests (useful for database connections)
  forceExit: true,

  // Timeout for tests (30 seconds)
  testTimeout: 30000,
};
