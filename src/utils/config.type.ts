import { WatcherOptionMap } from "@watchers";
import { NotifierOptionMap } from "@notifiers";

export interface ConfigData {
    watchInterval: number;
    watchers: Partial<WatcherOptionMap>;
    notifiers: Partial<NotifierOptionMap>;
    ignores?: string[];
}
