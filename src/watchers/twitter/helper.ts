import { TwitterAuth } from "@watchers/twitter/auth";
import { TWITTER_AUTH_TOKEN } from "@watchers/twitter/constants";

import { generateRandomString } from "@utils/generateRandomString";
import { Fetcher } from "@utils/fetcher";

export class TwitterHelper {
    private readonly fetcher: Fetcher = new Fetcher();

    private authToken: string = TWITTER_AUTH_TOKEN;
    private csrf: string | null = generateRandomString(32, "0123456789abcdefghijklmnopqrstuvwxyz");
    private guest: string | null = null;

    private getHeaders() {
        const headers = {
            "Content-type": "application/json",
            "x-twitter-active-user": "yes",
            "x-twitter-client-language": "ko",
            Referer: "https://twitter.com/i/flow/login",
        };

        if (this.authToken) {
            headers["authorization"] = `Bearer ${this.authToken}`;
        }

        if (this.csrf) {
            headers["x-csrf-token"] = this.csrf;
        }

        if (this.guest) {
            headers["x-guest-token"] = this.guest;
        }

        return headers;
    }

    public doAuth() {
        return new TwitterAuth(
            this.fetcher,
            this.getHeaders.bind(this),
            token => {
                this.guest = token;
            },
            token => {
                this.csrf = token;
            },
        );
    }
}
