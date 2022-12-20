import { BaseNotifier } from "@notifiers/base";
import { BaseWatcher } from "@watchers/base";

import { UserRepository } from "@repositories/user";
import { UserLogRepository } from "@repositories/user-log";
import { User } from "@repositories/models/user";
import { UserLog } from "@repositories/models/user-log";

import { Loggable, Logger } from "@utils";

interface NewUsersTaskData {
    type: "new-users";
    data: User[];
}
interface NewLogsTaskData {
    type: "new-logs";
    data: UserLog[];
}
interface NotifyTaskData {
    type: "notify";
}
interface SaveTaskData {
    type: "save";
    savedCount: number;
}
interface TerminateTaskData {
    type: "terminate";
    reason: string;
}
interface SkipTaskData {
    type: "skip";
    reason: string;
}

export type TaskData =
    | NewUsersTaskData
    | NewLogsTaskData
    | NotifyTaskData
    | SaveTaskData
    | TerminateTaskData
    | SkipTaskData;
export type TaskClass = new (...args: ConstructorParameters<typeof BaseTask>) => BaseTask;

export abstract class BaseTask extends Loggable {
    public constructor(
        protected readonly watchers: ReadonlyArray<BaseWatcher<string>>,
        protected readonly notifiers: ReadonlyArray<BaseNotifier<string>>,
        protected readonly userRepository: UserRepository,
        protected readonly userLogRepository: UserLogRepository,
        name: string,
    ) {
        super(name.replace(/task$/i, ""));
    }

    public static isNewUsersData(data: TaskData): data is NewUsersTaskData {
        return data.type === "new-users";
    }
    public static isNewLogsData(data: TaskData): data is NewLogsTaskData {
        return data.type === "new-logs";
    }
    public static isTerminateData(data: TaskData): data is TerminateTaskData {
        return data.type === "terminate";
    }
    public static isSkipData(data: TaskData): data is SkipTaskData {
        return data.type === "skip";
    }

    public async doWork(previousData: TaskData[]): Promise<TaskData> {
        const data = await this.logger.work({
            message: Logger.format("processing `{green}` task", this.getName()),
            level: "info",
            work: () => this.process(previousData),
        });

        this.logData(data);
        return data;
    }

    protected abstract process(previousData: TaskData[]): Promise<TaskData>;

    protected terminate(reason: string): TerminateTaskData {
        return { type: "terminate", reason };
    }
    protected skip(reason: string): SkipTaskData {
        return { type: "skip", reason };
    }

    private logData(data: TaskData) {
        if (BaseTask.isNewLogsData(data) && data.data.length > 0) {
            this.logger.info(Logger.format("Created {green} new logs", data.data.length));
        }

        if (BaseTask.isTerminateData(data)) {
            this.logger.info(Logger.format("Terminating whole task pipeline: {red}", data.reason));
        }

        if (BaseTask.isSkipData(data)) {
            this.logger.info(Logger.format("Skipping `{green}` task: {red}", this.getName(), data.reason));
        }
    }
}
