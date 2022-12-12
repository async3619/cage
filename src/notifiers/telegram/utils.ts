import { SelectOnly } from "@utils/types";
import { NotificationTarget, TelegramNotificationData } from "@notifiers/telegram/types";
import { NotifyPair } from "@notifiers/type";
import {
    TELEGRAM_FOLLOWERS_TEMPLATE,
    TELEGRAM_LOG_COUNT,
    TELEGRAM_RENAMES_TEMPLATE,
    TELEGRAM_UNFOLLOWERS_TEMPLATE,
} from "@notifiers/telegram/constants";

export function generateNotificationTargets(
    pairs: Record<keyof SelectOnly<TelegramNotificationData, string>, NotifyPair[]>,
): NotificationTarget[] {
    return [
        {
            fieldName: "followers",
            countFieldName: "followerCount",
            word: "new follower",
            template: TELEGRAM_FOLLOWERS_TEMPLATE,
            pairs: pairs.followers.slice(0, TELEGRAM_LOG_COUNT),
            count: pairs.followers.length,
        },
        {
            fieldName: "unfollowers",
            countFieldName: "unfollowerCount",
            word: "unfollower",
            template: TELEGRAM_UNFOLLOWERS_TEMPLATE,
            pairs: pairs.unfollowers.slice(0, TELEGRAM_LOG_COUNT),
            count: pairs.unfollowers.length,
        },
        {
            fieldName: "renames",
            countFieldName: "renameCount",
            word: "rename",
            template: TELEGRAM_RENAMES_TEMPLATE,
            pairs: pairs.renames.slice(0, TELEGRAM_LOG_COUNT),
            count: pairs.renames.length,
        },
    ];
}
