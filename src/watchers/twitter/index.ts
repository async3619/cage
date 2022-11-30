/* eslint-disable @typescript-eslint/no-empty-function */
import { BaseWatcher } from "@watchers/base";
import { TwitterHelper } from "@watchers/twitter/helper";

import { Follower, ProviderInitializeContext } from "@utils/type";

export type TWITTER_PROVIDER_ENV_KEYS = "TWITTER_USER_ID" | "TWITTER_PASSWORD";

export class TwitterWatcher extends BaseWatcher {
    private readonly signHelper: TwitterHelper = new TwitterHelper();

    public constructor() {
        super();
    }

    public getName(): string {
        return "Twitter";
    }

    public async initialize({ env }: ProviderInitializeContext): Promise<void> {
        if (!env.CAGE_TWITTER_USER_ID) {
            throw new Error("Environment variable 'CAGE_TWITTER_USER_ID' should be provided.");
        } else if (!env.CAGE_TWITTER_PASSWORD) {
            throw new Error("Environment variable 'CAGE_TWITTER_PASSWORD' should be provided.");
        }

        if (!this.signHelper.isLogged) {
            await this.login(env.CAGE_TWITTER_USER_ID, env.CAGE_TWITTER_PASSWORD);
        }
    }
    public async finalize(): Promise<void> {}

    public async doWatch(): Promise<void> {}

    public serialize(): Record<string, any> {
        return {
            helper: this.signHelper.serialize(),
        };
    }
    public hydrate(data: Record<string, any>): void {
        this.signHelper.hydrate(data.helper);
    }

    private async getAllFollowers() {
        const result = await this.signHelper.getFollowers();
        const followers: Follower[] = [...result[0]];
        let next = result[1];
        while (true) {
            if (!next) {
                break;
            }

            const [nextFollowers, nextFunction] = await next();
            followers.push(...nextFollowers);

            next = nextFunction;
        }

        return followers;
    }

    private async login(userId: string, password: string) {
        await this.signHelper
            .doAuth()
            .doInstrumentation()
            .setUserId(userId)
            .setPassword(password)
            .doDuplicationCheck()
            .action();
    }
}
