import pluralize from "pluralize";
import { User } from "@repositories/models/user";

import { Loggable } from "@utils/types";
import { BaseEntity } from "typeorm";

export interface BaseWatcherOptions<TWatcher = unknown> {
    type: TWatcher extends BaseWatcher<infer TType> ? Lowercase<TType> : string;
}

export type PartialUser = Omit<
    User,
    keyof BaseEntity | "from" | "id" | "lastlyCheckedAt" | "createdAt" | "updatedAt" | "userLogs" | "userLogIds"
>;

export abstract class BaseWatcher<TType extends string> extends Loggable<TType> {
    protected constructor(name: TType) {
        super(name);
    }

    public abstract initialize(): Promise<void>;

    public async doWatch(startedAt: Date): Promise<User[]> {
        const followers = await this.getFollowers();
        const from = this.getName().toLowerCase();

        this.logger.info("Successfully crawled {} {}", [followers.length, pluralize("follower", followers.length)]);

        return followers.map(user =>
            User.create({
                ...user,
                id: `${from}:${user.uniqueId}`,
                from,
                lastlyCheckedAt: startedAt,
            }),
        );
    }

    protected abstract getFollowers(): Promise<PartialUser[]>;
}
