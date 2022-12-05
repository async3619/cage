/* eslint-disable @typescript-eslint/no-empty-function */
import pluralize from "pluralize";

import { BaseWatcher } from "@watchers/base";
import { TwitterHelper } from "@watchers/twitter/helper";

import { UserData } from "@root/repositories/models/user";

import { ProviderInitializeContext } from "@utils/types";

export type TWITTER_PROVIDER_ENV_KEYS = "TWITTER_USER_ID" | "TWITTER_PASSWORD";

export class TwitterWatcher extends BaseWatcher {
    private readonly helper: TwitterHelper = new TwitterHelper();

    public constructor() {
        super("Twitter");
    }

    public async initialize({ env }: ProviderInitializeContext): Promise<void> {
        if (!env.CAGE_TWITTER_USER_ID) {
            throw new Error("Environment variable 'CAGE_TWITTER_USER_ID' should be provided.");
        } else if (!env.CAGE_TWITTER_PASSWORD) {
            throw new Error("Environment variable 'CAGE_TWITTER_PASSWORD' should be provided.");
        }

        if (!this.helper.isLogged) {
            await this.login(env.CAGE_TWITTER_USER_ID, env.CAGE_TWITTER_PASSWORD);
        }
    }
    public async finalize(): Promise<void> {}

    public async doWatch() {
        const allFollowers = await this.helper.getAllFollowers();

        this.logger.silly("Successfully crawled {} {}", [
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

    public serialize(): Record<string, any> {
        return {
            helper: this.helper.serialize(),
        };
    }
    public hydrate(data: Record<string, any>): void {
        this.helper.hydrate(data.helper);
    }

    private async login(userId: string, password: string) {
        await this.helper
            .doAuth()
            .doInstrumentation()
            .setUserId(userId)
            .setPassword(password)
            .doDuplicationCheck()
            .action();
    }
}
