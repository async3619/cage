import { BaseWatcher } from "@watchers/base";
import { TwitterWatcher } from "@watchers/twitter";

export const AVAILABLE_PROVIDERS: ReadonlyArray<BaseWatcher> = [new TwitterWatcher()];
