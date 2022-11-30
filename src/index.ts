import * as chalk from "chalk";
import * as fs from "fs-extra";
import * as cron from "node-cron";
import cronstrue from "cronstrue";

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

    const providerNames = AVAILABLE_PROVIDERS.map(p => `\`${chalk.green(p.getName())}\``).join(", ");
    const formattedCron = cronstrue.toString("0 * * * * *");

    Logger.info(`start to watch through ${providerNames} provider${AVAILABLE_PROVIDERS.length === 1 ? "" : "s"}:`);
    Logger.info(` - watching cron rule: \`0 * * * * *\` ${chalk.gray(`(${formattedCron})`)}`);

    const task = cron.schedule("0 * * * * *", async () => {
        for (const provider of AVAILABLE_PROVIDERS) {
            await Logger.work(
                "info",
                `determine followers data through \`${chalk.green(provider.getName())}\` watcher ... `,
                async () => {
                    await provider.doWatch();
                },
            );
        }
    });

    let cleaningUp = false;
    const cleanUp = async () => {
        if (cleaningUp) {
            return;
        }

        cleaningUp = true;
        task.stop();

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
    };

    process.on("exit", cleanUp);
    process.on("SIGTERM", cleanUp);
    process.on("SIGINT", cleanUp);
    process.on("SIGUSR1", cleanUp);
    process.on("SIGUSR2", cleanUp);
    process.on("uncaughtException", cleanUp);
}

main();
