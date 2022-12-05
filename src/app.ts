import * as fs from "fs-extra";
import * as path from "path";
import { DataSource } from "typeorm";
import chalk from "chalk";
import prettyMilliseconds from "pretty-ms";
import pluralize from "pluralize";

import { UserRepository } from "@repositories/user";
import { UserLogRepository } from "@repositories/user-log";

import { User, UserData } from "@repositories/models/user";
import { UserLog, UserLogType } from "@root/repositories/models/user-log";

import { AVAILABLE_WATCHERS } from "@watchers";

import { Config } from "@utils/config";
import { throttle } from "@utils/throttle";
import { Env, Loggable, ProviderInitializeContext } from "@utils/types";
import { mapBy } from "@utils/mapBy";

export class App extends Loggable {
    private readonly followerDataSource: DataSource;
    private readonly initializeContext: Readonly<ProviderInitializeContext> = {
        env: process.env as Env,
    };

    private readonly userRepository: UserRepository;
    private readonly userLogRepository: UserLogRepository;

    private cleaningUp = false;
    private config: Config | null = null;

    public constructor() {
        super("App");
        this.followerDataSource = new DataSource({
            type: "sqlite",
            database: path.join(process.cwd(), "./data.sqlite"),
            entities: [User, UserLog],
            dropSchema: true,
            synchronize: true,
        });

        this.userRepository = new UserRepository(this.followerDataSource.getRepository(User));
        this.userLogRepository = new UserLogRepository(this.followerDataSource.getRepository(UserLog));

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
        this.logger.info("start to watch through {} {}.", [watcherNames, pluralize("watcher", targetWatchers.length)]);

        while (true) {
            try {
                const [, elapsedTime] = await throttle(this.onCycle.bind(this), this.config.watchInterval, true);
                this.logger.debug(`last task finished in ${chalk.green("{}")}.`, [
                    prettyMilliseconds(elapsedTime, { verbose: true }),
                ]);
            } catch (e) {
                if (!(e instanceof Error)) {
                    throw e;
                }

                this.logger.error("An error occurred while processing scheduled task: {}", [e.message]);
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

        const startedDate = new Date();
        const allUserData: UserData[] = [];
        for (const watcher of AVAILABLE_WATCHERS) {
            const userData = await watcher.doWatch();

            allUserData.push(...userData);
        }

        this.logger.info(`all {} {} collected.`, [allUserData.length, pluralize("follower", allUserData.length)]);

        const followingMap = await this.userLogRepository.getFollowStatusMap();
        const oldUsers = await this.userRepository.find();
        const newUsers = await this.userRepository.createFromData(allUserData, startedDate);
        const newUserMap = mapBy(newUsers, "id");

        // find users who are not followed yet.
        const newFollowers = newUsers.filter(p => !followingMap[p.id]);
        const unfollowers = oldUsers.filter(p => !newUserMap[p.id] && followingMap[p.id]);

        const newLogs = await this.userLogRepository.batchWriteLogs([
            [newFollowers, UserLogType.Follow],
            [unfollowers, UserLogType.Unfollow],
        ]);

        this.logger.info(`all {} {} saved`, [newLogs.length, pluralize("log", newLogs.length)]);

        this.logger.info("tracked {} new {}", [newFollowers.length, pluralize("follower", newFollowers.length)]);
        this.logger.info("tracked {} un{}", [unfollowers.length, pluralize("follower", unfollowers.length)]);
    };
}
