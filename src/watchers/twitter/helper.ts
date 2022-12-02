import { TwitterAuth } from "@watchers/twitter/auth";
import { TWITTER_AUTH_TOKEN } from "@watchers/twitter/constants";
import { FollowerAPIResponse, FollowerUser } from "@watchers/twitter/types";
import { findBottomCursorFromFollower, findUserDataFromFollower } from "@watchers/twitter/utils";

import { generateRandomString } from "@utils/generateRandomString";
import { Fetcher } from "@utils/fetcher";
import { Hydratable, Serializable } from "@utils/type";

type FollowerCursor = string;
type GetFollowersResult = [FollowerUser["legacy"][], (() => Promise<GetFollowersResult>) | null];

export class TwitterHelper implements Serializable, Hydratable {
    private readonly fetcher: Fetcher = new Fetcher();
    private readonly defaultCsrf = generateRandomString(32, "0123456789abcdefghijklmnopqrstuvwxyz");

    private authToken: string = TWITTER_AUTH_TOKEN;
    private guest: string | null = null;
    private currentUserId: string | null = null;

    public get isLogged() {
        return Boolean(this.currentUserId);
    }

    private getHeaders() {
        const headers = {
            "Content-type": "application/json",
            "x-twitter-active-user": "yes",
            "x-twitter-client-language": "ko",
            "x-csrf-token": this.fetcher.getCookies().ct0 || this.defaultCsrf,
            Referer: "https://twitter.com/i/flow/login",
        };

        if (this.authToken) {
            headers["authorization"] = `Bearer ${this.authToken}`;
        }

        if (this.guest) {
            headers["x-guest-token"] = this.guest;
        }

        return headers;
    }
    private getUserId() {
        if (!this.currentUserId) {
            const { twid } = this.fetcher.getCookies();
            if (!twid) {
                throw new Error("twid cookie not found");
            }

            const [, userId] = twid.replace(/"/g, "").split("=");
            this.currentUserId = userId;
            console.log(userId);
        }

        return this.currentUserId;
    }

    public doAuth() {
        return new TwitterAuth(this.fetcher, this.getHeaders.bind(this), token => (this.guest = token));
    }

    public async getFollowers(cursor: FollowerCursor | null = null): Promise<GetFollowersResult> {
        const variables: Record<string, unknown> = {
            userId: this.getUserId(),
            count: 100,
            includePromotedContent: false,
            withSuperFollowsUserFields: true,
            withDownvotePerspective: false,
            withReactionsMetadata: false,
            withReactionsPerspective: false,
            withSuperFollowsTweetFields: true,
        };

        if (cursor) {
            variables.cursor = cursor;
        }

        const features = {
            responsive_web_twitter_blue_verified_badge_is_enabled: true,
            verified_phone_label_enabled: false,
            responsive_web_graphql_timeline_navigation_enabled: true,
            unified_cards_ad_metadata_container_dynamic_card_content_query_enabled: true,
            tweetypie_unmention_optimization_enabled: true,
            responsive_web_uc_gql_enabled: true,
            vibe_api_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            standardized_nudges_misinfo: true,
            tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
            interactive_text_enabled: true,
            responsive_web_text_conversations_enabled: false,
            responsive_web_enhance_cards_enabled: true,
        };

        const params = new URLSearchParams({
            variables: JSON.stringify(variables),
            features: JSON.stringify(features),
        });

        const data = await this.fetcher.fetchJson<FollowerAPIResponse>(
            `https://twitter.com/i/api/graphql/_gXC5CopoM8fIgawvyGpIg/Followers?${params.toString()}`,
            {
                headers: this.getHeaders(),
                method: "GET",
            },
        );

        const bottomCursor = findBottomCursorFromFollower(data);
        if (!bottomCursor) {
            throw new Error("Failed to find bottom cursor");
        }

        const users = findUserDataFromFollower(data);
        if (!users) {
            throw new Error("Failed to find users");
        }

        return [users, users.length >= 100 ? this.getFollowers.bind(this, bottomCursor) : null];
    }
    public async getAllFollowers(): Promise<FollowerUser["legacy"][]> {
        const result = await this.getFollowers();
        const followers: FollowerUser["legacy"][] = [...result[0]];
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

    public serialize(): Record<string, unknown> {
        return {
            fetcher: this.fetcher.serialize(),
            authToken: this.authToken,
            guest: this.guest,
            currentUserId: this.currentUserId,
        };
    }
    public hydrate(data: Record<string, unknown>): void {
        this.fetcher.hydrate(data.fetcher as Record<string, string>);
        this.authToken = data.authToken as string;
        this.guest = data.guest as string | null;
        this.currentUserId = data.currentUserId as string | null;
    }
}
