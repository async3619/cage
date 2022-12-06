import { ITwitterApiClientPlugin, TwitterApi, TwitterApiReadOnly } from "twitter-api-v2";
import { TwitterApiRateLimitPlugin } from "@twitter-api-v2/plugin-rate-limit";

import { UserData } from "@repositories/models/user";

import { TwitterApiKeyAuth, TwitterBasicAuth, TwitterBearerTokenAuth } from "@watchers/twitter/types";

export class TwitterHelper {
    private static createClient(configs: TwitterApiKeyAuth | TwitterBasicAuth | TwitterBearerTokenAuth) {
        const plugins: ITwitterApiClientPlugin[] = [new TwitterApiRateLimitPlugin()];

        switch (configs.type) {
            case "api-key":
                return new TwitterApi({ appKey: configs.apiKey, appSecret: configs.apiSecret }, { plugins }).readOnly;

            case "basic":
                return new TwitterApi({ username: configs.username, password: configs.password }, { plugins }).readOnly;

            case "bearer-token":
                return new TwitterApi(configs.bearerToken, { plugins }).readOnly;

            default:
                throw new Error("Invalid auth type");
        }
    }

    private twitterClient: TwitterApiReadOnly;

    public constructor(private readonly configs: TwitterApiKeyAuth | TwitterBasicAuth | TwitterBearerTokenAuth) {
        this.twitterClient = TwitterHelper.createClient(this.configs);
    }

    public async getFollowers(): Promise<Omit<UserData, "from">[]> {
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

    public async initialize() {
        if (this.configs.type === "api-key") {
            await this.twitterClient.appLogin();
        }
    }

    public getHashData() {
        return this.configs;
    }
    public hydrate(configs: TwitterApiKeyAuth | TwitterBasicAuth | TwitterBearerTokenAuth): void {
        this.twitterClient = TwitterHelper.createClient(configs);
    }
    public serialize(): TwitterApiKeyAuth | TwitterBasicAuth | TwitterBearerTokenAuth {
        return this.configs;
    }
}
