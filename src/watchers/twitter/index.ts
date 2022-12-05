/* eslint-disable @typescript-eslint/no-empty-function */
import pluralize from "pluralize";

import { BaseWatcher } from "@watchers/base";
import { TwitterHelper } from "@watchers/twitter/helper";

import { UserData } from "@root/repositories/models/user";

export interface TwitterWatcherOptions {
    type: "twitter";
}

export class TwitterWatcher extends BaseWatcher {
    private readonly helper: TwitterHelper = new TwitterHelper();
    private readonly userId: string;
    private readonly password: string;

    public constructor() {
        super("Twitter");

        this.userId = process.env.CAGE_TWITTER_USER_ID || "";
        this.password = process.env.CAGE_TWITTER_PASSWORD || "";
    }

    public async initialize(_: TwitterWatcherOptions): Promise<void> {
        if (!this.userId) {
            throw new Error("Environment variable 'CAGE_TWITTER_USER_ID' should be provided.");
        }

        if (!this.password) {
            throw new Error("Environment variable 'CAGE_TWITTER_PASSWORD' should be provided.");
        }

        if (!this.helper.isLogged) {
            await this.login(this.userId, this.password);
        }
    }

    public async doWatch() {
        const allFollowers = await this.helper.getAllFollowers();

        this.logger.verbose("Successfully crawled {} {}", [
            allFollowers.length,
            pluralize("follower", allFollowers.length),
        ]);

        return allFollowers.map<UserData>(user => ({
            uniqueId: user.rest_id,
            userId: user.legacy.screen_name,
            displayName: user.legacy.name,
            from: this.getName().toLowerCase(),
        }));
    }

    protected getHashData(): any {
        return [this.userId, this.password];
    }

    protected serialize(): Record<string, any> {
        return {
            helper: this.helper.serialize(),
        };
    }
    protected hydrate(data: Record<string, any>): void {
        this.helper.hydrate(data.helper);
    }

    private async login(userId: string, password: string) {
        await this.helper.doAuth(userId, password);
    }
}