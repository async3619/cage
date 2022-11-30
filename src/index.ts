import * as chalk from "chalk";

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
        await Logger.work("info", `Try to initialize \`${chalk.green(provider.getName())}\` watcher ... `, async () => {
            await provider.initialize(initializeContext);
        });
    }

    for (const provider of AVAILABLE_PROVIDERS) {
        await Logger.work("info", `Try to finalize \`${chalk.green(provider.getName())}\` watcher ... `, async () => {
            await provider.finalize();
        });
    }
}

main();
