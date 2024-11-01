import { BaseNotifier } from "@notifiers/base";
import { UserLog, UserLogType } from "@repositories/models/user-log";

export interface BaseNotifierOption<TNotifier = unknown> {
    type: TNotifier extends BaseNotifier<infer TType> ? Lowercase<TType> : string;
}

export type UserLogMap = Record<UserLogType, UserLog[]>;
