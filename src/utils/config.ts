import * as path from "path";
import * as fs from "fs-extra";
import chalk from "chalk";
import Ajv, { JSONSchemaType } from "ajv";
import betterAjvErrors from "better-ajv-errors";

import { AVAILABLE_WATCHERS } from "@watchers";

import { Logger } from "@utils/logger";

const ajv = new Ajv({ allErrors: true });

interface RawConfigData {
    target: string[];
    watchInterval: number;
}

const schema: JSONSchemaType<RawConfigData> = {
    type: "object",
    properties: {
        target: {
            type: "array",
            items: {
                type: "string",
                enum: AVAILABLE_WATCHERS.map(w => w.getName().toLowerCase()),
            },
        },
        watchInterval: {
            type: "integer",
        },
    },
    required: ["target", "watchInterval"],
    additionalProperties: false,
};

const validate = ajv.compile<RawConfigData>(schema);

export class Config {
    private static readonly logger = new Logger("Config");
    private static readonly DEFAULT_CONFIG_PATH = path.join(process.cwd(), "./config.json");

    public static async create(filePath: string = Config.DEFAULT_CONFIG_PATH) {
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
            message: `loading config file from ${pathToken} ... `,
            work: async () => {
                const data: RawConfigData = await fs.readJSON(filePath);
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
        return AVAILABLE_WATCHERS.filter(w => this.target.includes(w.getName().toLowerCase()));
    }
    public get target() {
        return [...this.rawData.target];
    }
    public get watchInterval() {
        return this.rawData.watchInterval;
    }

    private constructor(private readonly rawData: RawConfigData) {}
}
