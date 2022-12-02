/* eslint-disable @typescript-eslint/no-empty-function */
import { BaseWatcher } from "@watchers/base";
import { TwitterHelper } from "@watchers/twitter/helper";

import { Follower } from "@models/follower";

import { ProviderInitializeContext } from "@utils/type";

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
        const checkedAt = new Date();
        const allFollowers = await this.helper.getAllFollowers();
        this.logger.silly(`Total followers: ${allFollowers.length}`);

        return allFollowers.map(user => {
            const follower = Follower.create();
            follower.from = this.getName();
            follower.displayName = user.name;
            follower.isFollowing = true;
            follower.lastlyCheckedAt = checkedAt;
            follower.id = `${follower.from}:${user.screen_name}`;

            return follower;
        });
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
