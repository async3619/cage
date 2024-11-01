import _ from "lodash";

import { UserLog, UserLogType } from "@repositories/models/user-log";

import { UserLogMap } from "@notifiers/type";

export function groupNotifies(pairs: UserLog[]): UserLogMap {
    const result = _.groupBy(pairs, log => log.type);

    return {
        [UserLogType.Follow]: result[UserLogType.Follow] || [],
        [UserLogType.Unfollow]: result[UserLogType.Unfollow] || [],
        [UserLogType.RenameUserId]: result[UserLogType.RenameUserId] || [],
        [UserLogType.RenameDisplayName]: result[UserLogType.RenameDisplayName] || [],
        [UserLogType.Rename]: [
            ...(result[UserLogType.RenameDisplayName] || []),
            ...(result[UserLogType.RenameUserId] || []),
        ],
    };
}
