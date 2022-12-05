import * as fs from "fs-extra";
import * as tsj from "ts-json-schema-generator";

const config: tsj.Config = {
    path: "src/utils/config.type.ts",
    tsconfig: "tsconfig.json",
    type: "ConfigData",
    expose: "none",
};

(async () => {
    const schema = tsj.createGenerator(config).createSchema(config.type);
    const schemaString = JSON.stringify(schema, null, 4);
    await fs.writeFile("config.schema.json", schemaString);
})();
