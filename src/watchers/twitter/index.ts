import { TwitterApi, TwitterApiReadOnly } from "twitter-api-v2";
import { TwitterApiRateLimitPlugin } from "@twitter-api-v2/plugin-rate-limit";

import { UserData } from "@repositories/models/user";

import { BaseWatcher, BaseWatcherOptions } from "@watchers/base";

export interface TwitterWatcherOptions extends BaseWatcherOptions<TwitterWatcher> {
    bearerToken: string;
}

export class TwitterWatcher extends BaseWatcher<"Twitter"> {
    private readonly twitterClient: TwitterApiReadOnly;

    public constructor({ bearerToken }: TwitterWatcherOptions) {
        super("Twitter");
        this.twitterClient = new TwitterApi(bearerToken, { plugins: [new TwitterApiRateLimitPlugin()] }).readOnly;
    }

    public async initialize() {
        return;
    }
    public getProfileUrl(user: UserData) {
        return `https://twitter.com/${user.userId}`;
    }

    protected async getFollowers() {
        const followers = await this.twitterClient.v2.followers("1569485307049033729", {
            max_results: 1000,
            "user.fields": ["id", "name", "username", "profile_image_url"],
        });

        return followers.data.map(user => ({
            uniqueId: user.id,
            displayName: user.name,
            userId: user.username,
        }));
    }
}
