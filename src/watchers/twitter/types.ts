import { BaseWatcherOptions } from "@watchers/base";

export interface TwitterApiKeyAuth {
    type: "api-key";
    apiKey: string;
    apiSecret: string;
}

export interface TwitterBearerTokenAuth {
    type: "bearer-token";
    bearerToken: string;
}

export interface TwitterBasicAuth {
    type: "basic";
    username: string;
    password: string;
}

export type TwitterAuth = TwitterApiKeyAuth | TwitterBearerTokenAuth | TwitterBasicAuth;

export interface TwitterWatcherOptions extends BaseWatcherOptions<"twitter"> {
    auth: TwitterAuth;
}
