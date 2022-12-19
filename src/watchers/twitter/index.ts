import { TwitterApi, TwitterApiReadOnly } from "twitter-api-v2";
import { TwitterApiRateLimitPlugin } from "@twitter-api-v2/plugin-rate-limit";

import { UserData } from "@repositories/models/user";

import { BaseWatcher, BaseWatcherOptions } from "@watchers/base";

export interface TwitterWatcherOptions extends BaseWatcherOptions<TwitterWatcher> {
    bearerToken: string;
    username: string;
}

export class TwitterWatcher extends BaseWatcher<"Twitter"> {
    private readonly twitterClient: TwitterApiReadOnly;
    private readonly currentUserName: string;
    private currentUserId: string | null = null;

    public constructor({ bearerToken, username }: TwitterWatcherOptions) {
        super("Twitter");
        this.twitterClient = new TwitterApi(bearerToken, { plugins: [new TwitterApiRateLimitPlugin()] }).readOnly;
        this.currentUserName = username;
    }

    public async initialize() {
        const { data } = await this.twitterClient.v2.userByUsername(this.currentUserName, {
            "user.fields": ["id"],
        });

        if (!data) {
            throw new Error("Failed to get user id");
        }

        this.logger.verbose("Successfully initialized with user id {}", [data.id]);
        this.currentUserId = data.id;
    }
    public getProfileUrl(user: UserData) {
        return `https://twitter.com/${user.userId}`;
    }

    protected async getFollowers() {
        if (!this.currentUserId) {
            throw new Error("Watcher is not initialized");
        }

        const followers = await this.twitterClient.v2.followers(this.currentUserId, {
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
