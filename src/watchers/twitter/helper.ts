import { ITwitterApiClientPlugin, TwitterApi, TwitterApiReadOnly } from "twitter-api-v2";
import { TwitterApiRateLimitPlugin } from "@twitter-api-v2/plugin-rate-limit";

import { UserData } from "@repositories/models/user";

export class TwitterHelper {
    private static createClient(bearerToken: string) {
        const plugins: ITwitterApiClientPlugin[] = [new TwitterApiRateLimitPlugin()];
        return new TwitterApi(bearerToken, { plugins }).readOnly;
    }

    private twitterClient: TwitterApiReadOnly;

    public constructor(private readonly bearerToken: string) {
        this.twitterClient = TwitterHelper.createClient(this.bearerToken);
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
        return;
    }
}
