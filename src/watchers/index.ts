import { TwitterWatcher } from "@watchers/twitter";
import { TwitterWatcherOptions } from "@watchers/twitter/types";

import { GitHubWatcher } from "@watchers/github";
import { GitHubWatcherOptions } from "@watchers/github/types";

import { TypeMap } from "@utils/types";
import { BaseWatcher, BaseWatcherOptions } from "@watchers/base";

export type WatcherClasses = TwitterWatcher | GitHubWatcher;
export type WatcherTypes = Lowercase<WatcherClasses["name"]>;

export type WatcherOptions = TwitterWatcherOptions | GitHubWatcherOptions;
export type WatcherOptionMap = TypeMap<WatcherOptions>;

export type WatcherMap = {
    [TKey in WatcherClasses["name"] as Lowercase<TKey>]: TKey extends WatcherClasses["name"]
        ? Extract<WatcherClasses, { name: TKey }>
        : never;
};
export type WatcherFactoryMap = {
    [TKey in WatcherClasses["name"] as Lowercase<TKey>]: TKey extends WatcherClasses["name"]
        ? (options: WatcherOptionMap[Lowercase<TKey>]) => Extract<WatcherClasses, { name: TKey }>
        : never;
};
export type WatcherPair = [WatcherTypes, BaseWatcher<string>];

const AVAILABLE_WATCHERS: Readonly<WatcherFactoryMap> = {
    twitter: options => new TwitterWatcher(options),
    github: options => new GitHubWatcher(options),
};

export const createWatcher = (options: BaseWatcherOptions<any>): BaseWatcher<string> => {
    const { type } = options;

    return AVAILABLE_WATCHERS[type](options);
};
