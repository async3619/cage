import * as path from "path";
import * as fs from "fs-extra";
import { DataSource } from "typeorm";
import chalk from "chalk";
import prettyMilliseconds from "pretty-ms";
import pluralize from "pluralize";

import { UserRepository, User } from "@repositories/user";
import { UserLogRepository, UserLog } from "@repositories/user-log";

import { DEFAULT_TASKS, TaskData } from "@tasks";

import { Config, throttle, measureTime, sleep, Logger, Loggable } from "@utils";

export class App extends Loggable {
    private readonly followerDataSource: DataSource;
    private readonly userRepository: UserRepository;
    private readonly userLogRepository: UserLogRepository;
    private readonly taskClasses = DEFAULT_TASKS;

    private cleaningUp = false;
    private config: Config | null = null;

    public constructor(
        private readonly configFilePath: string,
        private readonly verbose: boolean,
        private readonly dropDatabase: boolean,
        private readonly databasePath: string,
    ) {
        super("App");
        Logger.verbose = verbose;

        if (!path.isAbsolute(this.databasePath)) {
            this.databasePath = path.join(process.cwd(), this.databasePath);
        }

        this.followerDataSource = new DataSource({
            type: "sqlite",
            database: this.databasePath,
            entities: [User, UserLog],
            synchronize: true,
        });

        this.userRepository = new UserRepository(this.followerDataSource.getRepository(User));
        this.userLogRepository = new UserLogRepository(this.followerDataSource.getRepository(UserLog));
    }

    private async doDropDatabase() {
        if (!fs.existsSync(this.databasePath)) {
            return;
        }

        await fs.unlink(this.databasePath);
    }

    public async run() {
        if (this.dropDatabase) {
            await this.logger.work({
                message: "dropping database",
                work: () => this.doDropDatabase(),
                level: "info",
            });
        }

        this.config = await Config.create(this.configFilePath);
        if (!this.config) {
            throw new Error("config is not loaded.");
        }

        const watchers = this.config.watchers;
        const notifiers = this.config.notifiers;

        if (!watchers.length) {
            this.logger.error("no watchers are configured. exiting...");
            return;
        }

        await this.logger.work({
            level: "info",
            message: "initialize database",
            work: () => this.followerDataSource.initialize(),
        });

        for (const [, watcher] of watchers) {
            await this.logger.work({
                level: "info",
                message: `initialize \`${chalk.green(watcher.getName())}\` watcher`,
                work: () => watcher.initialize(),
            });
        }

        for (const [, notifier] of notifiers) {
            await this.logger.work({
                level: "info",
                message: `initialize \`${chalk.green(notifier.getName())}\` notifier`,
                work: () => notifier.initialize(),
            });
        }

        const watcherNames = watchers.map(([, p]) => `\`${chalk.green(p.getName())}\``).join(", ");
        this.logger.info("start to watch through {} {}.", [watcherNames, pluralize("watcher", watchers.length)]);

        const interval = this.config.watchInterval;
        while (true) {
            try {
                const [, elapsedTime] = await throttle(
                    async () => {
                        const result = await measureTime(async () => this.onCycle());
                        if ("exception" in result) {
                            throw result.exception;
                        }

                        const { elapsedTime: time } = result;

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

                this.logger.error("an error occurred while processing scheduled task: {}", [e.message]);
            }
        }
    }

    private onCycle = async () => {
        if (!this.config) {
            throw new Error("Config is not loaded.");
        }

        const taskData: TaskData[] = [];
        for (const TaskClass of this.taskClasses) {
            const taskInstance = new TaskClass(
                this.config.watchers.map(([, watcher]) => watcher),
                this.config.notifiers.map(([, notifier]) => notifier),
                this.userRepository,
                this.userLogRepository,
                TaskClass.name,
            );

            const data = await taskInstance.doWork(taskData);
            if (data.type === "terminate") {
                return;
            }

            taskData.push(data);
        }
    };
}
