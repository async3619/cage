import type { JestConfigWithTsJest } from "ts-jest";
import { pathsToModuleNameMapper } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const jestConfig: JestConfigWithTsJest = {
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: "./src",
    testRegex: ".*\\.spec\\.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: ["**/*.ts", "!coverage/**"],
    coverageDirectory: "../coverage",
    testEnvironment: "node",
    roots: ["<rootDir>"],
    modulePaths: [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/../" }),
};

export = jestConfig;
