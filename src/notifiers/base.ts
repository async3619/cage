import { UserLog } from "@repositories/models/user-log";

import { BaseWatcher } from "@watchers/base";

import { Loggable } from "@utils/types";

export type NotifyPair = [BaseWatcher<string>, UserLog];

export abstract class BaseNotifier extends Loggable {
    protected constructor(name: string) {
        super(name);
    }

    public getName() {
        return super.getName().replace("Notifier", "");
    }

    public abstract initialize(options: Record<string, any>): Promise<void>;

    public abstract notify(logs: NotifyPair[]): Promise<void>;
}
