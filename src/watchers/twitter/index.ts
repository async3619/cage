/* eslint-disable @typescript-eslint/no-empty-function */
import pluralize from "pluralize";

import { BaseWatcher } from "@watchers/base";
import { TwitterWatcherOptions } from "@watchers/twitter/types";

import { TwitterHelper } from "@watchers/twitter/helper";

export class TwitterWatcher extends BaseWatcher<"Twitter"> {
    private readonly helper: TwitterHelper;

    public constructor({ auth }: TwitterWatcherOptions) {
        super("Twitter");
        this.helper = new TwitterHelper(auth);
    }
    public async initialize(): Promise<void> {
        await this.helper.initialize();
    }

    public async getFollowers() {
        const allFollowers = await this.helper.getFollowers();

        this.logger.verbose("Successfully crawled {} {}", [
            allFollowers.length,
            pluralize("follower", allFollowers.length),
        ]);

        return allFollowers;
    }

    protected getHashData(): any {
        return this.helper.getHashData();
    }
    protected serialize(): Record<string, any> {
        return {
            helper: this.helper.serialize(),
        };
    }
    protected hydrate(data: Record<string, any>): void {
        this.helper.hydrate(data.helper);
    }
}
