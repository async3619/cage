import { BaseWatcher } from "@watchers/base";
import { TwitterHelper } from "@watchers/twitter/helper";

import { ProviderInitializeContext } from "@utils/type";

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

        await this.login(env.CAGE_TWITTER_USER_ID, env.CAGE_TWITTER_PASSWORD);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async finalize(): Promise<void> {}

    public async startWatch(): Promise<void> {
        return Promise.resolve(undefined);
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
