import { UserData } from "@repositories/models/user";

import { WatcherTypes } from "@watchers";

import { Loggable } from "@utils/types";

export interface BaseWatcherOptions<TType extends WatcherTypes> {
    type: TType;
}

export type PartialUserData = Omit<UserData, "from">;

export abstract class BaseWatcher<TType extends string> extends Loggable<TType> {
    protected constructor(name: TType) {
        super(name);
    }

    public abstract initialize(): Promise<void>;

    public async doWatch(): Promise<UserData[]> {
        const followers = await this.getFollowers();

        return followers.map(user => ({
            ...user,
            from: this.getName().toLowerCase(),
        }));
    }

    protected abstract getFollowers(): Promise<PartialUserData[]>;
}
