import { BaseWatcher } from "@watchers/base";
import { BaseNotifier } from "@notifiers/base";

import { UserLog } from "@repositories/models/user-log";

export interface BaseNotifierOption<TNotifier = unknown> {
    type: TNotifier extends BaseNotifier<infer TType> ? Lowercase<TType> : string;
}

export type NotifyPair = [BaseWatcher<string>, UserLog];
