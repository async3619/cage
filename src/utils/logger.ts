import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { measureTime } from "@utils/measureTime";
import { Fn } from "@utils/type";

type LoggerFn = (content: string, breakLine?: boolean) => void;
type LogLevel = "silly" | "info" | "warn" | "error";

const LogLevels: LogLevel[] = ["warn", "info", "silly", "error"];
const LOG_LEVEL_COLOR_MAP: Record<LogLevel, Fn<[string], string>> = {
    silly: chalk.cyan,
    info: chalk.cyan,
    warn: chalk.yellow,
    error: chalk.red,
};

function createLoggerFn(level: LogLevel): LoggerFn {
    const MAX_WIDTH = Math.max(...LogLevels.map(l => l.length));
    const tokens = chalk.green(
        [
            chalk.cyan(dayjs().format("HH:mm:ss.SSS")),
            LOG_LEVEL_COLOR_MAP[level](level.toUpperCase().padEnd(MAX_WIDTH, " ")),
        ]
            .map(t => `[${t}]`)
            .join(""),
    );

    return (content, breakLine = true) => {
        const formattedString = `${tokens} ${content}`;
        if (breakLine) {
            console.log(formattedString);
        } else {
            process.stdout.write(formattedString);
        }
    };
}

interface LoggerType extends Record<LogLevel, LoggerFn> {
    clear(): void;
    work(level: LogLevel, message: string, work: () => void | Promise<void>, done?: string): Promise<void>;
}

export const Logger: LoggerType = (() => {
    const loggers: Record<LogLevel, LoggerFn> = {
        info: createLoggerFn("info"),
        error: createLoggerFn("error"),
        warn: createLoggerFn("warn"),
        silly: createLoggerFn("silly"),
    };

    return {
        ...loggers,
        work: async (level: LogLevel, message: string, work: () => void | Promise<void>, done = "done.") => {
            loggers[level](message, false);

            const elapsedTime = await measureTime(() => work());

            process.stdout.write(`${done} ${chalk.gray(`(${elapsedTime}ms)`)}\n`);
        },
        clear: () => {
            console.clear();
        },
    };
})();
