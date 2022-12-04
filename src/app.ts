import * as _ from "lodash";
import { DataSource } from "typeorm";
import chalk from "chalk";
import * as fs from "fs-extra";
import * as path from "path";
import prettyMilliseconds from "pretty-ms";

import { Follower } from "@models/follower";
import { FollowerLog, FollowerLogType } from "@models/follower-log";

import { Config } from "@utils/config";
import { throttle } from "@utils/throttle";
import { getFollowerDiff } from "@utils/getFollowerDiff";
import { Env, Loggable, ProviderInitializeContext } from "@utils/types";

export class App extends Loggable {
    private readonly followerDataSource: DataSource;
    private readonly initializeContext: Readonly<ProviderInitializeContext> = {
        env: process.env as Env,
    };

    private cleaningUp = false;
    private config: Config | null = null;

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
    }

    public async run() {
        this.logger.clear();
        this.logger.info("Hello World from Cage! 🐦");

        this.config = await Config.create();
        if (!this.config) {
            process.exit(-1);
            return;
        }

        const targetWatchers = this.config.watchers;
        await this.logger.work({
            level: "info",
            message: "initialize database ... ",
            work: () => this.followerDataSource.initialize(),
        });

        for (const watcher of targetWatchers) {
            await this.logger.work({
                level: "debug",
                message: `loading lastly dumped data of \`${chalk.green(watcher.getName())}\` watcher ... `,
                work: async () => {
                    const fileName = `${watcher.getName().toLowerCase()}.json`;
                    const filePath = `./dump/${fileName}`;

                    if (!fs.existsSync(filePath)) {
                        throw new Error(`Dump file \`${fileName}\` does not exist.`);
                    }

                    watcher.hydrate(await fs.readJSON(filePath));
                },
            });
        }

        for (const watcher of targetWatchers) {
            await this.logger.work({
                level: "info",
                message: `initialize \`${chalk.green(watcher.getName())}\` watcher ... `,
                work: () => watcher.initialize(this.initializeContext),
            });
        }

        const watcherNames = targetWatchers.map(p => `\`${chalk.green(p.getName())}\``).join(", ");
        this.logger.info(`start to watch through ${watcherNames} watchers${targetWatchers.length === 1 ? "" : "s"}.`);

        while (true) {
            try {
                const [, elapsedTime] = await throttle(this.onCycle.bind(this), 1000, true);
                this.logger.debug(`last task finished in ${chalk.green(prettyMilliseconds(elapsedTime))}.`);
            } catch (e) {
                if (!(e instanceof Error)) {
                    throw e;
                }

                this.logger.error(`An error occurred while processing scheduled task: ${e.message}`);
            }
        }
    }

    private async cleanUp() {
        if (!this.config || this.cleaningUp) {
            return;
        }

        this.cleaningUp = true;

        const targetWatchers = this.config.watchers;
        for (const watcher of targetWatchers) {
            await this.logger.work({
                level: "info",
                message: `finalize \`${chalk.green(watcher.getName())}\` watcher ... `,
                work: () => watcher.finalize(),
            });
        }

        for (const watcher of targetWatchers) {
            await this.logger.work({
                level: "debug",
                message: `saving serialized data of \`${chalk.green(watcher.getName())}\` watcher ... `,
                work: async () => {
                    const data = watcher.serialize();
                    const filePath = `./dump/${watcher.getName().toLowerCase()}.json`;

                    await fs.ensureFile(filePath);
                    await fs.writeJson(filePath, data, { spaces: 4 });
                },
            });
        }

        this.logger.info("Bye World from Cage! 🐦");
    }

    private onCycle = async () => {
        if (!this.config) {
            throw new Error("Config is not loaded.");
        }

        const targetWatchers = this.config.watchers;
        for (const watcher of targetWatchers) {
            const currentTime = new Date();
            const watcherName = watcher.getName();
            const nameToken = `\`${chalk.green(watcherName)}\``;
            const newFollowers = await this.logger.work({
                level: "info",
                message: `determine followers data through ${nameToken} watcher ... `,
                work: () => watcher.doWatch(),
            });

            if (!newFollowers) {
                this.logger.error(`no followers data was returned from ${nameToken} watcher.`);
                continue;
            }

            const allFollowers = await Follower.find({
                where: { from: watcherName },
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

            await Follower.update({ from: watcherName }, { lastlyCheckedAt: currentTime });
        }
    };
}
