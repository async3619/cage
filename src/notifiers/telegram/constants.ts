import { UserLogType } from "@repositories/models/user-log";

export const CONTENT_TEMPLATES: Partial<Record<UserLogType, string[]>> = {
    [UserLogType.Follow]: ["**🎉 {}**\n\n{}", "new follower"],
    [UserLogType.Unfollow]: ["**❌ {}**\n\n{}", "unfollower"],
    [UserLogType.Rename]: ["**✏️ {}**\n\n{}", "rename"],
};

export const MAXIMUM_LOG_COUNT = 50;
