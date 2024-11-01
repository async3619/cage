import * as path from "path";
import * as fs from "fs-extra";
import chalk from "chalk";
import betterAjvErrors from "better-ajv-errors";

import { createWatcher, WatcherMap, WatcherPair, WatcherTypes } from "@watchers";
import { createNotifier, NotifierMap, NotifierPair, NotifierTypes } from "@notifiers";

import { DEFAULT_CONFIG, validate } from "@utils/config.const";
import { ConfigData } from "@utils/config.type";
import { Logger } from "@utils/logger";

import schema from "@root/../config.schema.json";

export class Config {
    private static readonly logger = new Logger("Config");
    private static readonly DEFAULT_CONFIG_PATH = path.join(process.cwd(), "./config.json");

    public static async create(filePath: string = Config.DEFAULT_CONFIG_PATH) {
        if (!path.isAbsolute(filePath)) {
            filePath = path.join(process.cwd(), filePath);
        }

        const pathToken = `\`${chalk.green(filePath)}\``;

        if (!fs.existsSync(filePath)) {
            Config.logger.warn(
                `config file ${pathToken} does not exist. we will make a new default config file for you.`,
            );

            await fs.writeJSON(filePath, DEFAULT_CONFIG, {
                spaces: 4,
            });

            Config.logger.warn(`config file ${pathToken} has been created successfully.`);
        }

        try {
            return await Config.logger.work({
                level: "info",
                message: `loading config file from ${pathToken}`,
                work: async () => {
                    const data: ConfigData = await fs.readJSON(filePath);
                    const valid = validate(data);
                    if (!valid && validate.errors) {
                        const output = betterAjvErrors(schema, data, validate.errors, {
                            format: "cli",
                            indent: 4,
                        });

                        throw new Error(`config file is invalid.\n${output}`);
                    }

                    const watcherTypes = Object.keys(data.watchers) as WatcherTypes[];
                    const watchers: WatcherPair[] = [];
                    const watcherMap: Partial<WatcherMap> = {};
                    for (const type of watcherTypes) {
                        const configs = data.watchers[type];
                        if (!configs) {
                            throw new Error(`watcher \`${type}\` is not configured.`);
                        }

                        const watcher = createWatcher(configs);
                        watchers.push([type, watcher]);
                        watcherMap[type] = watcher as any;
                    }

                    const notifierTypes = Object.keys(data.notifiers) as NotifierTypes[];
                    const notifiers: NotifierPair[] = [];
                    const notifierMap: Partial<NotifierMap> = {};
                    for (const type of notifierTypes) {
                        const configs = data.notifiers[type];
                        if (!configs) {
                            throw new Error(`notifier \`${type}\` is not configured.`);
                        }

                        const notifier = createNotifier(configs);
                        notifiers.push([type, notifier]);
                        notifierMap[type] = notifier as any;
                    }

                    return new Config(data, watcherTypes, watchers, watcherMap, notifierTypes, notifiers, notifierMap);
                },
            });
        } catch (e) {
            process.exit(-1);
        }
    }

    get watcherTypes(): ReadonlyArray<WatcherTypes> {
        return [...this._watcherTypes];
    }
    get watchers(): ReadonlyArray<WatcherPair> {
        return [...this._watchers];
    }
    get watcherMap(): Partial<WatcherMap> {
        return { ...this._watcherMap };
    }

    get notifierTypes(): ReadonlyArray<NotifierTypes> {
        return [...this._notifierTypes];
    }
    get notifiers(): ReadonlyArray<NotifierPair> {
        return [...this._notifiers];
    }
    get notifierMap(): Partial<NotifierMap> {
        return { ...this._notifierMap };
    }

    public get ignores(): ReadonlyArray<string> {
        return [...(this.rawData.ignores || [])];
    }
    public get watchInterval() {
        return this.rawData.watchInterval;
    }

    private constructor(
        private readonly rawData: ConfigData,
        private readonly _watcherTypes: ReadonlyArray<WatcherTypes>,
        private readonly _watchers: ReadonlyArray<WatcherPair>,
        private readonly _watcherMap: Partial<WatcherMap>,
        private readonly _notifierTypes: NotifierTypes[],
        private readonly _notifiers: NotifierPair[],
        private readonly _notifierMap: Partial<NotifierMap>,
    ) {}
}
