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
