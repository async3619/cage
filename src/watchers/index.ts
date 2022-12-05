import { BaseWatcher } from "@watchers/base";
import { TwitterWatcher, TwitterWatcherOptions } from "@watchers/twitter";

import { TypeMap } from "@utils/types";

export type WatcherOptions = TwitterWatcherOptions;
export type WatcherOptionMap = TypeMap<WatcherOptions>;

export const AVAILABLE_WATCHERS: ReadonlyArray<BaseWatcher> = [new TwitterWatcher()];
