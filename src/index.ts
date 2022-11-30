import * as chalk from "chalk";
import * as fs from "fs-extra";

import { AVAILABLE_PROVIDERS } from "@watchers";

import { Logger } from "@utils/logger";
import { Env, ProviderInitializeContext } from "@utils/type";

async function main() {
    Logger.clear();
    Logger.info("Hello World from Cage! 🐦");

    const initializeContext: ProviderInitializeContext = {
        env: process.env as Env,
    };

    for (const provider of AVAILABLE_PROVIDERS) {
        await Logger.work(
            "debug",
            `loading lastly dumped data of \`${chalk.green(provider.getName())}\` watcher ... `,
            async () => {
                const fileName = `${provider.getName().toLowerCase()}.json`;
                const filePath = `./dump/${fileName}`;

                if (!fs.existsSync(filePath)) {
                    throw new Error(`Dump file \`${fileName}\` does not exist.`);
                }

                provider.hydrate(await fs.readJSON(filePath));
            },
        );
    }

    for (const provider of AVAILABLE_PROVIDERS) {
        await Logger.work("info", `initialize \`${chalk.green(provider.getName())}\` watcher ... `, async () => {
            await provider.initialize(initializeContext);
        });
    }

    for (const provider of AVAILABLE_PROVIDERS) {
        await Logger.work("info", `finalize \`${chalk.green(provider.getName())}\` watcher ... `, async () => {
            await provider.finalize();
        });
    }

    for (const provider of AVAILABLE_PROVIDERS) {
        await Logger.work(
            "debug",
            `saving serialized data of \`${chalk.green(provider.getName())}\` watcher ... `,
            async () => {
                const data = provider.serialize();
                const filePath = `./dump/${provider.getName().toLowerCase()}.json`;

                await fs.ensureFile(filePath);
                await fs.writeJson(filePath, data, { spaces: 4 });
            },
        );
    }

    Logger.info("Bye World from Cage! 🐦");
}

main();
