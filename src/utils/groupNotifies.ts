import _ from "lodash";

import { UserLogType } from "@repositories/models/user-log";

import { NotifyPair } from "@notifiers/type";

export function groupNotifies(pairs: NotifyPair[]) {
    return _.groupBy(pairs, ([, log]) => log.type) as unknown as Partial<Record<UserLogType, NotifyPair[]>>;
}
