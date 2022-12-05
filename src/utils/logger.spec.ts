import stripAnsi from "strip-ansi";

import { Logger, LogLevel } from "@utils/logger";
import { sleep } from "@utils/sleep";
import chalk from "chalk";

describe("Logger class", () => {
    const TARGET_LOG_LEVELS: LogLevel[] = ["info", "warn", "error", "debug", "verbose"];
    let target: Logger;
    let buffer: string[];
    let logMockFn: jest.Mock;

    function clearBuffer() {
        buffer.length = 0;
    }

    beforeEach(() => {
        target = new Logger("Test");
        buffer = [];
        logMockFn = jest.fn().mockImplementation((data: string) => {
            buffer.push(stripAnsi(data));
        });

        jest.spyOn(process.stdout, "write").mockImplementation(logMockFn);
    });

    it("should format string correctly", () => {
        const formattedMessage = Logger.format("{} {} {}", "a", "b", "c");

        expect(formattedMessage).toBe("a b c");
    });

    it("should format object correctly", () => {
        const formattedMessage = Logger.format("{}", { a: "b", c: "d" });

        expect(formattedMessage).toBe(JSON.stringify({ a: "b", c: "d" }));
    });

    it("should not format string if no arguments are provided", () => {
        const formattedMessage = Logger.format("{} {} {}");

        expect(formattedMessage).toBe("{} {} {}");
    });

    it("should style string with format tokens correctly", () => {
        const formattedMessage = Logger.format("{bold}", "a");

        expect(formattedMessage).toBe(chalk.bold("a"));
    });

    it("should provide methods for all log levels", () => {
        const mockedLogContent = "test";
        for (const logLevel of TARGET_LOG_LEVELS) {
            clearBuffer();
            target[logLevel](mockedLogContent);

            expect(target[logLevel]).toBeDefined();
            expect(buffer).toHaveLength(1);
            expect(buffer[0]).toContain(logLevel.toUpperCase());
            expect(buffer[0].trim().endsWith(mockedLogContent)).toBeTruthy();
        }
    });

    it("should provide a method to clear the console", () => {
        const clearMock = jest.spyOn(console, "clear");
        target.clear();

        expect(target.clear).toBeDefined();
        expect(clearMock).toHaveBeenCalled();

        clearMock.mockClear();
    });

    it("should provide a method to log a work", async () => {
        const mockedWork = async () => {
            await sleep(1000);
            return 1;
        };

        const mockedWorkResult = await target.work({
            work: mockedWork,
            message: "Test",
            level: "info",
        });

        expect(target.work).toBeDefined();
        expect(mockedWorkResult).toBe(1);
        expect(buffer[0].trim()).toMatch(/Test ...$/);
        expect(buffer[1].trim()).toMatch("done.");
    });

    it("should print failed information when a work fails", async () => {
        const mockedWork = async () => {
            await sleep(1000);
            throw new Error("Test");
        };

        await target.work({
            work: mockedWork,
            message: "Test",
            level: "info",
        });

        expect(buffer[0].trim()).toMatch(/Test ...$/);
        expect(buffer[1].trim()).toMatch(/failed. \([0-9]*?ms\)/);
        expect(buffer[2].trim().includes("Test")).toBeTruthy();
    });

    it("should format the log message correctly", () => {
        const mockedLogContent = "test {} {}";
        const mockedArgs = ["1", "2"];
        target.info(mockedLogContent, mockedArgs);

        expect(buffer[0].trim().endsWith("test 1 2")).toBeTruthy();
    });

    it("should leave the {} in the log message if there are no arguments", () => {
        const mockedLogContent = "test {} {}";
        target.info(mockedLogContent, []);

        expect(buffer[0].trim().endsWith("test {} {}")).toBeTruthy();
    });
});
