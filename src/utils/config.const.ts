import _ from "lodash";
import Ajv from "ajv";

import { ConfigData } from "@utils/config.type";

import schema from "@root/../config.schema.json";

const ajv = new Ajv({ allErrors: true });
export const validate = ajv.compile<ConfigData>(
    _.merge(schema, {
        definitions: {
            ConfigData: {
                type: "object",
                properties: {
                    watchInterval: {
                        minimum: 60000,
                    },
                },
            },
        },
    }),
);

export const DEFAULT_CONFIG: ConfigData = {
    watchInterval: 60000,
    watchers: {},
    notifiers: {},
};
