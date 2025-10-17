export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@srv/(.*)$": "<rootDir>/src/srv/$1",
    "^@entities/(.*)$": "<rootDir>/src/entities/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@database/(.*)$": "<rootDir>/src/database/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@root/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
