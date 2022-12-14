import { BaseWatcher, BaseWatcherOptions } from "@watchers/base";
import { TwitterWatcher, TwitterWatcherOptions } from "@watchers/twitter";
import { GitHubWatcher, GitHubWatcherOptions } from "@watchers/github";

import { TypeMap } from "@utils/types";

export type WatcherClasses = TwitterWatcher | GitHubWatcher;
export type WatcherTypes = Lowercase<WatcherClasses["name"]>;

export type WatcherOptions = TwitterWatcherOptions | GitHubWatcherOptions;
export type WatcherOptionMap = TypeMap<WatcherOptions>;

export type WatcherMap = {
    [TKey in WatcherClasses["name"] as Lowercase<TKey>]: Extract<WatcherClasses, BaseWatcher<TKey>>;
};
export type WatcherFactoryMap = {
    [TKey in WatcherClasses["name"] as Lowercase<TKey>]: (
        options: Extract<WatcherOptions, BaseWatcherOptions<BaseWatcher<TKey>>>,
    ) => Extract<WatcherClasses, BaseWatcher<TKey>>;
};
export type WatcherPair = [WatcherTypes, BaseWatcher<string>];

const AVAILABLE_WATCHERS: Readonly<WatcherFactoryMap> = {
    twitter: options => new TwitterWatcher(options),
    github: options => new GitHubWatcher(options),
};

export const createWatcher = (options: BaseWatcherOptions): BaseWatcher<string> => {
    const { type } = options;

    return AVAILABLE_WATCHERS[type](options);
};
