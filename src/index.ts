import updateNotifier from "update-notifier";
import { Command } from "commander";
import boxen from "boxen";

import { App } from "@root/app";
import { Logger } from "@utils/logger";

import packageJson from "../package.json";

(async () => {
    const program = new Command();

    program
        .name("cage")
        .description("(almost) realtime unfollower detection for any social services 🦜⛓️ 🔒")
        .option("-c, --config <path>", "path to the configuration file", "./config.json")
        .option("-v, --verbose", "enable verbose level logging")
        .version(packageJson.version)
        .parse(process.argv);

    const { config, verbose } = program.opts<{ config: string; verbose: boolean }>();
    const { latest, current } = await updateNotifier({
        pkg: packageJson,
        distTag: packageJson.version.includes("dev") ? "dev" : "latest",
    }).fetchInfo();

    if (latest !== current) {
        const contents = Logger.format(
            "{white}",
            [
                Logger.format(`Update available {yellow} → {green}`, current, latest),
                Logger.format(`Run {cyan} to update`, `npm i -g ${packageJson.name}@${latest}`),
            ].join("\n"),
        );

        console.log(
            Logger.format(
                "{cyan}",
                boxen(contents, {
                    padding: 1,
                    margin: 1,
                }),
            ),
        );
    }

    await new App(config, verbose).run();
})();
