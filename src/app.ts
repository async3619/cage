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
import { mapBy } from "@utils/mapBy";
import { measureTime } from "@utils/measureTime";
import { sleep } from "@utils/sleep";
import { Logger } from "@utils/logger";
import { Loggable } from "@utils/types";

export class App extends Loggable {
    private readonly followerDataSource: DataSource;
    private readonly userRepository: UserRepository;
    private readonly userLogRepository: UserLogRepository;

    private cleaningUp = false;
    private config: Config | null = null;

    public constructor(private readonly configFilePath: string, private readonly verbose: boolean) {
        super("App");
        Logger.verbose = verbose;

        this.followerDataSource = new DataSource({
            type: "sqlite",
            database: path.join(process.cwd(), "./data.sqlite"),
            entities: [User, UserLog],
            synchronize: true,
        });

        this.userRepository = new UserRepository(this.followerDataSource.getRepository(User));
        this.userLogRepository = new UserLogRepository(this.followerDataSource.getRepository(UserLog));
    }

    public async run() {
        this.logger.clear();

        this.config = await Config.create(this.configFilePath);
        if (!this.config) {
            process.exit(-1);
            return;
        }

        const watchers = this.config.watchers;
        const notifiers = this.config.notifiers;

        if (!watchers.length) {
            this.logger.warn("no watchers are configured. exiting...");
            return;
        }

        await this.logger.work({
            level: "info",
            message: "initialize database",
            work: () => this.followerDataSource.initialize(),
        });

        for (const watcher of watchers) {
            const options = this.config.watcherOptions[watcher.getName()];
            await watcher.loadState();

            await this.logger.work({
                level: "info",
                message: `initialize \`${chalk.green(watcher.getName())}\` watcher`,
                work: () => watcher.initialize(options),
            });

            await watcher.saveState();
        }

        for (const notifier of notifiers) {
            const options = this.config.notifierOptions?.[notifier.getName().toLowerCase()];
            if (!options) {
                this.logger.warn(`no options are configured for \`${chalk.green("{}")}\` notifier. skipping...`, [
                    notifier.getName(),
                ]);
            }

            await this.logger.work({
                level: "info",
                message: `initialize \`${chalk.green(notifier.getName())}\` notifier`,
                work: () => notifier.initialize(options),
            });
        }

        const watcherNames = watchers.map(p => `\`${chalk.green(p.getName())}\``).join(", ");
        this.logger.info("start to watch through {} {}.", [watcherNames, pluralize("watcher", watchers.length)]);

        const interval = this.config.watchInterval;
        while (true) {
            try {
                const [, elapsedTime] = await throttle(
                    async () => {
                        const { elapsedTime: time } = await measureTime(async () => this.onCycle());

                        this.logger.info(`last task finished in ${chalk.green("{}")}.`, [
                            prettyMilliseconds(time, { verbose: true }),
                        ]);

                        this.logger.info("waiting {green} for next cycle ...", [
                            prettyMilliseconds(interval - time, { verbose: true }),
                        ]);
                    },
                    this.config.watchInterval,
                    true,
                );

                if (elapsedTime < interval) {
                    await sleep(interval - elapsedTime);
                }

                if (this.cleaningUp) {
                    break;
                }
            } catch (e) {
                if (!(e instanceof Error)) {
                    throw e;
                }

                this.logger.error("An error occurred while processing scheduled task: {}", [e.message]);
            }
        }
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
        this.logger.info("tracked {} {}", [unfollowers.length, pluralize("unfollower", unfollowers.length)]);

        const notifiers = this.config.notifiers;
        if (!notifiers.length) {
            this.logger.info("no notifiers are configured. skipping notification...");
            return;
        }

        for (const notifier of notifiers) {
            await notifier.notify(newLogs);
        }
    };
}
