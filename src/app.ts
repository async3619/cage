import * as _ from "lodash";
import { DataSource } from "typeorm";
import * as chalk from "chalk";
import * as fs from "fs-extra";
import * as path from "path";

import { AVAILABLE_WATCHERS } from "@watchers";

import { Follower } from "@models/follower";
import { FollowerLog, FollowerLogType } from "@models/follower-log";

import { getFollowerDiff } from "@utils/getFollowerDiff";
import { Env, Loggable, ProviderInitializeContext } from "@utils/type";
import { sleep } from "@utils/sleep";

export class App extends Loggable {
    private readonly followerDataSource: DataSource;
    private readonly initializeContext: Readonly<ProviderInitializeContext> = {
        env: process.env as Env,
    };

    private cleaningUp = false;

    public constructor() {
        super("App");

        this.followerDataSource = new DataSource({
            type: "sqlite",
            database: path.join(process.cwd(), "./data.sqlite"),
            entities: [Follower, FollowerLog],
            dropSchema: true,
            synchronize: true,
        });

        process.on("exit", this.cleanUp.bind(this));
        process.on("SIGTERM", this.cleanUp.bind(this));
        process.on("SIGINT", this.cleanUp.bind(this));
        process.on("SIGUSR1", this.cleanUp.bind(this));
        process.on("SIGUSR2", this.cleanUp.bind(this));
        process.on("uncaughtException", this.cleanUp.bind(this));
    }

    public async run() {
        this.logger.clear();
        this.logger.info("Hello World from Cage! 🐦");

        await this.logger.work({
            level: "info",
            message: "initialize database ... ",
            work: () => this.followerDataSource.initialize(),
        });

        for (const provider of AVAILABLE_WATCHERS) {
            await this.logger.work({
                level: "debug",
                message: `loading lastly dumped data of \`${chalk.green(provider.getName())}\` watcher ... `,
                work: async () => {
                    const fileName = `${provider.getName().toLowerCase()}.json`;
                    const filePath = `./dump/${fileName}`;

                    if (!fs.existsSync(filePath)) {
                        throw new Error(`Dump file \`${fileName}\` does not exist.`);
                    }

                    provider.hydrate(await fs.readJSON(filePath));
                },
            });
        }

        for (const provider of AVAILABLE_WATCHERS) {
            await this.logger.work({
                level: "info",
                message: `initialize \`${chalk.green(provider.getName())}\` watcher ... `,
                work: () => provider.initialize(this.initializeContext),
            });
        }

        const providerNames = AVAILABLE_WATCHERS.map(p => `\`${chalk.green(p.getName())}\``).join(", ");

        this.logger.info(
            `start to watch through ${providerNames} watchers${AVAILABLE_WATCHERS.length === 1 ? "" : "s"}.`,
        );

        while (true) {
            try {
                await this.onCycle();
            } catch (e) {
                if (!(e instanceof Error)) {
                    throw e;
                }

                this.logger.error(`An error occurred while processing scheduled task: ${e.message}`);
            }

            this.logger.info("watching task done. now wait for 1 minute.");
            await sleep(60000);
        }
    }

    private async cleanUp() {
        if (this.cleaningUp) {
            return;
        }

        this.cleaningUp = true;

        for (const provider of AVAILABLE_WATCHERS) {
            await this.logger.work({
                level: "info",
                message: `finalize \`${chalk.green(provider.getName())}\` watcher ... `,
                work: () => provider.finalize(),
            });
        }

        for (const provider of AVAILABLE_WATCHERS) {
            await this.logger.work({
                level: "debug",
                message: `saving serialized data of \`${chalk.green(provider.getName())}\` watcher ... `,
                work: async () => {
                    const data = provider.serialize();
                    const filePath = `./dump/${provider.getName().toLowerCase()}.json`;

                    await fs.ensureFile(filePath);
                    await fs.writeJson(filePath, data, { spaces: 4 });
                },
            });
        }

        this.logger.info("Bye World from Cage! 🐦");
    }

    private onCycle = async () => {
        for (const provider of AVAILABLE_WATCHERS) {
            const currentTime = new Date();
            const providerName = provider.getName();
            const nameToken = `\`${chalk.green(providerName)}\``;
            const newFollowers = await this.logger.work({
                level: "info",
                message: `determine followers data through ${nameToken} watcher ... `,
                work: () => provider.doWatch(),
            });

            if (!newFollowers) {
                this.logger.error(`no followers data was returned from ${nameToken} watcher.`);
                continue;
            }

            const allFollowers = await Follower.find({
                where: { from: providerName },
                relations: ["followerLogs"],
            });
            const oldFollowers = allFollowers.filter(f => f.isFollowing);
            const followerLogsMap = _.chain(allFollowers)
                .keyBy("id")
                .mapValues(f => f.followerLogs)
                .value();

            const { removed, added } = getFollowerDiff(oldFollowers, newFollowers);

            if (added.length > 0) {
                for (const follower of added) {
                    const newLog = new FollowerLog();
                    newLog.type = FollowerLogType.Follow;
                    newLog.createdAt = currentTime;

                    follower.isFollowing = true;
                    follower.followerLogs = [...(followerLogsMap[follower.id] || []), newLog];
                }

                await Follower.save(added);
            }

            if (removed.length > 0) {
                for (const follower of removed) {
                    const newLog = new FollowerLog();
                    newLog.type = FollowerLogType.Unfollow;
                    newLog.createdAt = currentTime;

                    follower.isFollowing = false;
                    follower.followerLogs = [...followerLogsMap[follower.id], newLog];
                }

                await Follower.save(removed);
            }

            if (added.length === 0 && removed.length === 0) {
                this.logger.info(`no changes found from ${nameToken} watcher.`);
            } else {
                this.logger.info(
                    `found ${chalk.green(added.length)} new follower(s) and ${chalk.red(
                        removed.length,
                    )} removed follower(s).`,
                );
            }

            await Follower.update({ from: providerName }, { lastlyCheckedAt: currentTime });
        }
    };
}
