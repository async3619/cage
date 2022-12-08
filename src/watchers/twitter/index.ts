/* eslint-disable @typescript-eslint/no-empty-function */
import pluralize from "pluralize";

import { BaseWatcher } from "@watchers/base";
import { TwitterWatcherOptions } from "@watchers/twitter/types";

import { TwitterHelper } from "@watchers/twitter/helper";

export class TwitterWatcher extends BaseWatcher<"Twitter"> {
    private readonly helper: TwitterHelper;

    public constructor({ bearerToken }: TwitterWatcherOptions) {
        super("Twitter");
        this.helper = new TwitterHelper(bearerToken);
    }

    public async initialize() {
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
}
