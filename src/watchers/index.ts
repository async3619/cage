import { BaseWatcher } from "@watchers/base";
import { TwitterWatcher } from "@watchers/twitter";

export const AVAILABLE_WATCHERS: ReadonlyArray<BaseWatcher> = [new TwitterWatcher()];
