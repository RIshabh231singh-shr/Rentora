module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  verbose: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/seed.js"
  ],
  testMatch: [
    "**/tests/**/*.test.js"
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"]
};
