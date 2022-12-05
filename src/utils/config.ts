import _ from "lodash";
import * as path from "path";
import * as fs from "fs-extra";
import chalk from "chalk";
import Ajv from "ajv";
import betterAjvErrors from "better-ajv-errors";

import { AVAILABLE_WATCHERS } from "@watchers";
import { AVAILABLE_NOTIFIERS } from "@notifiers";

import { ConfigData } from "@utils/config.type";
import { Logger } from "@utils/logger";

import schema from "@root/../config.schema.json";

const ajv = new Ajv({ allErrors: true });

const validate = ajv.compile<ConfigData>(schema);

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

            await fs.writeJSON(
                filePath,
                {
                    targetProviders: ["twitter"],
                    watchInterval: 60000,
                },
                {
                    spaces: 4,
                },
            );

            Config.logger.warn(`config file ${pathToken} has been created successfully.`);
        }

        return Config.logger.work({
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

                return new Config(data);
            },
        });
    }

    public get watchers() {
        const names = Object.keys(this.rawData.watchers);
        return AVAILABLE_WATCHERS.filter(w => names.includes(w.getName().toLowerCase()));
    }
    public get watcherOptions() {
        return _.cloneDeep(this.rawData.watchers);
    }

    public get notifiers() {
        if (!this.rawData.notifiers) {
            return [];
        }

        const names = Object.keys(this.rawData.notifiers);
        return AVAILABLE_NOTIFIERS.filter(n => names.includes(n.getName().replace("Notifier", "").toLowerCase()));
    }
    public get notifierOptions() {
        return _.cloneDeep(this.rawData.notifiers);
    }

    public get watchInterval() {
        return this.rawData.watchInterval;
    }

    private constructor(private readonly rawData: ConfigData) {}
}
