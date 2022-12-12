import { SelectOnly } from "@utils/types";
import { NotifyPair } from "@notifiers/type";

export interface TelegramNotificationData {
    followers?: string;
    unfollowers?: string;
    renames?: string;
    followerCount?: number;
    unfollowerCount?: number;
    renameCount?: number;
}

export interface TokenResponse {
    token: string;
    expires: number;
}
export interface NotifyResponse {
    success: boolean;
}

export interface NotificationTarget {
    fieldName: keyof SelectOnly<TelegramNotificationData, string>;
    countFieldName: keyof SelectOnly<TelegramNotificationData, number>;
    word: string;
    template: string;
    count: number;
    pairs: NotifyPair[];
}
