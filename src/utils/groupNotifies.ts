import _ from "lodash";

import { UserLogType } from "@repositories/models/user-log";

import { NotifyPair } from "@notifiers/type";

type MapKeys = Exclude<UserLogType, UserLogType.RenameUserId | UserLogType.RenameDisplayName>;

export function groupNotifies(pairs: NotifyPair[]): Record<MapKeys, NotifyPair[]> {
    const result = _.groupBy(pairs, ([, log]) => log.type);

    return {
        [UserLogType.Follow]: result[UserLogType.Follow] || [],
        [UserLogType.Unfollow]: result[UserLogType.Unfollow] || [],
        [UserLogType.Rename]: [
            ...(result[UserLogType.RenameDisplayName] || []),
            ...(result[UserLogType.RenameUserId] || []),
        ],
    };
}
