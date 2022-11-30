import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { measureTime } from "@utils/measureTime";
import { Fn } from "@utils/type";

type LoggerFn = (content: string, breakLine?: boolean) => void;
type LogLevel = "silly" | "info" | "warn" | "error" | "debug";

const LOG_LEVEL_COLOR_MAP: Record<LogLevel, Fn<[string], string>> = {
    silly: chalk.cyan,
    info: chalk.cyan,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.magenta,
};

function createLoggerFn(level: LogLevel): LoggerFn {
    const levelString = LOG_LEVEL_COLOR_MAP[level](level.toUpperCase());

    return (content, breakLine = true) => {
        const tokens = chalk.green(
            [chalk.cyan(dayjs().format("HH:mm:ss.SSS")), levelString].map(t => `[${t}]`).join(""),
        );

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
        debug: createLoggerFn("debug"),
    };

    return {
        ...loggers,
        work: async (level: LogLevel, message: string, work: () => void | Promise<void>, done = "done.") => {
            loggers[level](message, false);

            const { elapsedTime, exception } = await measureTime(() => work());

            if (exception) {
                process.stdout.write(`failed. (${elapsedTime}ms)`);
                loggers.error(`Last task failed with error: ${exception.message}`);
                return;
            }

            process.stdout.write(`${done} ${chalk.gray(`(${elapsedTime}ms)`)}\n`);
        },
        clear: () => {
            console.clear();
        },
    };
})();
