import * as dayjs from "dayjs";
import * as chalk from "chalk";

import { Fn } from "./type";

type LoggerFn = (content: string) => void;
type LogLevel = "silly" | "info" | "warn" | "error";

const LogLevels: LogLevel[] = ["warn", "info", "silly", "error"];
const LOG_LEVEL_COLOR_MAP: Record<LogLevel, Fn<string, string>> = {
    silly: chalk.cyan,
    info: chalk.cyan,
    warn: chalk.yellow,
    error: chalk.red,
};

function createLoggerFn(level: LogLevel): LoggerFn {
    const MAX_WIDTH = Math.max(...LogLevels.map(l => l.length));
    const tokens = chalk.green(
        [
            chalk.cyan(dayjs().format("YYYY-MM-DD HH:mm:ss")),
            LOG_LEVEL_COLOR_MAP[level](level.toUpperCase().padEnd(MAX_WIDTH, " ")),
        ]
            .map(t => `[${t}]`)
            .join(""),
    );

    return content => {
        const formattedString = `${tokens} ${content}`;
        console.log(formattedString);
    };
}

interface LoggerType extends Record<LogLevel, LoggerFn> {
    clear(): void;
}

export const Logger: LoggerType = {
    info: createLoggerFn("info"),
    error: createLoggerFn("error"),
    warn: createLoggerFn("warn"),
    silly: createLoggerFn("silly"),
    clear() {
        console.clear();
    },
};
