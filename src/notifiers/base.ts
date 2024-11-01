import { capitalCase } from "change-case";

import { UserLog, UserLogType } from "@repositories/models/user-log";

import { UserLogMap } from "@notifiers/type";

import { Logger } from "@utils/logger";
import { Loggable } from "@utils/types";

export abstract class BaseNotifier<TType extends string> extends Loggable<TType> {
    protected constructor(name: TType) {
        super(name);
    }

    public getName() {
        return super.getName().replace("Notifier", "");
    }

    public abstract initialize(): Promise<void>;

    public abstract notify(logs: UserLog[], logMap: UserLogMap): Promise<void>;

    protected formatNotify(log: UserLog): string {
        const { user } = log;

        if (log.type === UserLogType.RenameUserId || log.type === UserLogType.RenameDisplayName) {
            const tokens = [
                capitalCase(user.from),
                log.oldDisplayName || "",
                log.oldUserId || "",
                user.profileUrl,
                log.type === UserLogType.RenameDisplayName ? "" : "@",
                log.type === UserLogType.RenameUserId ? user.userId : user.displayName,
            ];

            return Logger.format("[{}] [{} (@{})]({}) → {}{}", ...tokens);
        }

        return Logger.format(
            "[{}] [{} (@{})]({})",
            capitalCase(user.from),
            user.displayName,
            user.userId,
            user.profileUrl,
        );
    }
}
