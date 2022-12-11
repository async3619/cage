import { NotifyPair } from "@notifiers/type";

import { Loggable } from "@utils/types";
import { UserLogType } from "@repositories/models/user-log";
import { Logger } from "@utils/logger";

export abstract class BaseNotifier<TType extends string> extends Loggable<TType> {
    protected constructor(name: TType) {
        super(name);
    }

    public getName() {
        return super.getName().replace("Notifier", "");
    }

    public abstract initialize(): Promise<void>;

    public abstract notify(logs: NotifyPair[]): Promise<void>;

    protected formatNotify(pair: NotifyPair): string {
        const [watcher, log] = pair;
        const { user } = log;

        if (log.type === UserLogType.RenameUserId || log.type === UserLogType.RenameDisplayName) {
            const tokens = [
                watcher.getName(),
                log.oldDisplayName || "",
                log.oldUserId || "",
                watcher.getProfileUrl(log.user),
                log.type === UserLogType.RenameDisplayName ? "" : "@",
                log.type === UserLogType.RenameUserId ? user.userId : user.displayName,
            ];

            return Logger.format("[{}] [{} (@{})]({}) → {}{}", ...tokens);
        }

        const tokens = [watcher.getName(), user.displayName, user.userId, watcher.getProfileUrl(user)];
        return Logger.format("[{}] [{} (@{})]({})", ...tokens);
    }
}
