import dayjs from "dayjs";
import chalk from "chalk";

import { measureTime } from "@utils/measureTime";
import { noop } from "@utils/noop";
import { Fn } from "@utils/types";

type LoggerFn = (content: string, args?: any[], breakLine?: boolean) => void;
export type LogLevel = "verbose" | "info" | "warn" | "error" | "debug";

const LOG_LEVEL_COLOR_MAP: Record<LogLevel, Fn<string, string>> = {
    verbose: chalk.blue,
    info: chalk.cyan,
    warn: chalk.yellow,
    error: chalk.red,
    debug: chalk.magenta,
};

interface WorkOptions<T> {
    level: LogLevel;
    message: string;
    failedLevel?: LogLevel;
    done?: string;
    work: () => T | Promise<T>;
}

const CHALK_FORMAT_NAMES: Array<keyof typeof chalk> = [
    "black",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "white",
    "gray",
    "grey",
    "blackBright",
    "redBright",
    "greenBright",
    "yellowBright",
    "blueBright",
    "magentaBright",
    "cyanBright",
    "whiteBright",
    "bgBlack",
    "bgRed",
    "bgGreen",
    "bgYellow",
    "bgBlue",
    "bgMagenta",
    "bgCyan",
    "bgWhite",
    "bgGray",
    "bgGrey",
    "bgBlackBright",
    "bgRedBright",
    "bgGreenBright",
    "bgYellowBright",
    "bgBlueBright",
    "bgMagentaBright",
    "bgCyanBright",
    "bgWhiteBright",
    "italic",
    "bold",
    "underline",
    "strikethrough",
];

export class Logger implements Record<LogLevel, LoggerFn> {
    public static verbose = false;

    public static format(content: string, ...args: any[]): string {
        if (args.length === 0) {
            return content;
        }

        const replacements = args.map(arg => {
            if (typeof arg === "object") {
                return JSON.stringify(arg);
            }

            return `${arg}`;
        });

        const matches = content.matchAll(/(\{(.*?)\})/g);
        if (!matches) {
            return content;
        }

        for (const [, token, style] of matches) {
            let item = replacements.shift();
            if (typeof item === "undefined") {
                item = "{}";
            }

            if (style) {
                style.split(",").forEach(style => {
                    if (CHALK_FORMAT_NAMES.includes(style as any)) {
                        item = chalk[style](item);
                    }
                });
            }

            content = content.replace(token, item);
        }

        return content;
    }

    private static readonly buffer: string[] = [];
    private static isLocked = false;

    private static setLock(lock: boolean) {
        if (!lock && Logger.isLocked) {
            Logger.buffer.forEach(message => process.stdout.write(message));
            Logger.buffer.length = 0;
        }

        Logger.isLocked = lock;
    }

    public readonly info: LoggerFn;
    public readonly warn: LoggerFn;
    public readonly error: LoggerFn;
    public readonly debug: LoggerFn;
    public readonly verbose: LoggerFn;

    public constructor(private readonly name: string) {
        this.info = this.createLoggerFunction("info");
        this.warn = this.createLoggerFunction("warn");
        this.error = this.createLoggerFunction("error");
        this.debug = this.createLoggerFunction("debug");
        this.verbose = this.createLoggerFunction("verbose");
    }

    private createLoggerFunction = (level: LogLevel): LoggerFn => {
        const levelString = LOG_LEVEL_COLOR_MAP[level](level.toUpperCase());

        return (content, args, breakLine = true) => {
            if (level === "verbose" && !Logger.verbose) {
                return noop;
            }

            const tokens = chalk.green(
                [chalk.cyan(dayjs().format("HH:mm:ss.SSS")), chalk.yellow(this.name), levelString]
                    .map(t => `[${t}]`)
                    .join(""),
            );

            // replace all {} with the corresponding argument
            let message = content;
            if (args) {
                message = Logger.format(content, ...args);
            }

            const formattedString = `${tokens} ${message}${breakLine ? "\n" : ""}`;
            if (Logger.isLocked) {
                Logger.buffer.push(formattedString);
            } else {
                process.stdout.write(formattedString);
            }
        };
    };

    public clear = () => {
        console.clear();
    };

    public work = async <T>({
        work,
        failedLevel = "error",
        level,
        message,
        done = "done.",
    }: WorkOptions<T>): Promise<T> => {
        this[level](`${message} ... `, [], false);

        Logger.setLock(true);
        const measuredData = await measureTime(work);
        const time = chalk.gray(`(${measuredData.elapsedTime}ms)`);

        if ("exception" in measuredData) {
            process.stdout.write(`failed. ${time}\n`);
            this[failedLevel](`${measuredData.exception.message}`);
            Logger.setLock(false);
            throw measuredData.exception;
        }

        process.stdout.write(`${done} ${time}\n`);
        Logger.setLock(false);

        return measuredData.data;
    };
}
