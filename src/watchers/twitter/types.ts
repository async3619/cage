import { BaseWatcherOptions } from "@watchers/base";

export interface TwitterWatcherOptions extends BaseWatcherOptions<"twitter"> {
    bearerToken: string;
}
