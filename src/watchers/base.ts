import pluralize from "pluralize";
import { UserData } from "@repositories/models/user";

import { Loggable } from "@utils/types";

export interface BaseWatcherOptions<TWatcher = unknown> {
    type: TWatcher extends BaseWatcher<infer TType> ? Lowercase<TType> : string;
}

export type PartialUserData = Omit<UserData, "from">;

export abstract class BaseWatcher<TType extends string> extends Loggable<TType> {
    protected constructor(name: TType) {
        super(name);
    }

    public abstract initialize(): Promise<void>;

    public async doWatch(): Promise<UserData[]> {
        const followers = await this.getFollowers();

        this.logger.info("Successfully crawled {} {}", [followers.length, pluralize("follower", followers.length)]);

        return followers.map(user => ({
            ...user,
            from: this.getName().toLowerCase(),
        }));
    }

    protected abstract getFollowers(): Promise<PartialUserData[]>;
    public abstract getProfileUrl(user: UserData): string;
}
