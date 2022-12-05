import dayjs from "dayjs";
import chalk from "chalk";

import { measureTime } from "@utils/measureTime";
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

export class Logger implements Record<LogLevel, LoggerFn> {
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
            const tokens = chalk.green(
                [chalk.cyan(dayjs().format("HH:mm:ss.SSS")), chalk.yellow(this.name), levelString]
                    .map(t => `[${t}]`)
                    .join(""),
            );

            // replace all {} with the corresponding argument
            let message = content;
            if (args) {
                message = content.replace(/{}/g, () => {
                    if (args.length === 0) {
                        return "{}";
                    }

                    return args.shift();
                });
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
    }: WorkOptions<T>): Promise<T | null> => {
        this[level](`${message} ... `, [], false);

        Logger.setLock(true);
        const measuredData = await measureTime(work);
        const time = chalk.gray(`(${measuredData.elapsedTime}ms)`);

        if ("exception" in measuredData) {
            process.stdout.write(`failed. ${time}\n`);
            this[failedLevel](`${measuredData.exception.message}`);
            Logger.setLock(false);
            return null;
        }

        process.stdout.write(`${done} ${time}\n`);
        Logger.setLock(false);

        return measuredData.data;
    };
}
