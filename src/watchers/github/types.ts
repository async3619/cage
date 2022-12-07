import { BaseWatcherOptions } from "@watchers/base";

export interface GitHubWatcherOptions extends BaseWatcherOptions<"github"> {
    authToken: string;
}
