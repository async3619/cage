import { BaseWatcher, BaseWatcherOptions } from "@watchers/base";
import { TwitterWatcher, TwitterWatcherOptions } from "@watchers/twitter";
import { GitHubWatcher, GitHubWatcherOptions } from "@watchers/github";
import { MastodonWatcher, MastodonWatcherOptions } from "@watchers/mastodon";
import { BlueSkyWatcher, BlueSkyWatcherOptions } from "@watchers/bluesky";

import { TypeMap } from "@utils/types";
import { InstagramWatcher, InstagramWatcherOptions } from "@watchers/instagram";

export type WatcherClasses = TwitterWatcher | GitHubWatcher | MastodonWatcher | BlueSkyWatcher | InstagramWatcher;
export type WatcherTypes = Lowercase<WatcherClasses["name"]>;

export type WatcherOptions =
    | TwitterWatcherOptions
    | GitHubWatcherOptions
    | MastodonWatcherOptions
    | BlueSkyWatcherOptions
    | InstagramWatcherOptions;

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
    mastodon: options => new MastodonWatcher(options),
    bluesky: options => new BlueSkyWatcher(options),
    instagram: options => new InstagramWatcher(options),
};

export const createWatcher = (options: BaseWatcherOptions): BaseWatcher<string> => {
    const { type } = options;

    return AVAILABLE_WATCHERS[type](options);
};
