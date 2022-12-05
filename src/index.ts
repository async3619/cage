import { Command } from "commander";
import { App } from "@root/app";
import { noop } from "@utils/noop";
import { version } from "../package.json";

const program = new Command();

program
    .name("cage")
    .description("(almost) realtime unfollower detection for any social services 🐦⛓️ 🔒")
    .option("-c, --config <path>", "path to the configuration file", "./config.json")
    .option("--verbose", "enable verbose level logging")
    .version(version, "-v, --version")
    .parse(process.argv);

const { config, verbose } = program.opts<{ config: string; verbose: boolean }>();

new App(config, verbose).run().then().catch(noop);
