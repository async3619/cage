import pluralize from "pluralize";

import { BaseNotifier } from "@notifiers/base";
import { BaseNotifierOption, UserLogMap } from "@notifiers/type";
import { NotifyResponse, TelegramNotificationData, TokenResponse } from "@notifiers/telegram/types";
import { CONTENT_TEMPLATES, MAXIMUM_LOG_COUNT } from "@notifiers/telegram/constants";

import { UserLog, UserLogType } from "@repositories/models/user-log";

import { Fetcher } from "@utils/fetcher";
import { HttpError } from "@utils/httpError";
import { Logger } from "@utils/logger";

export interface TelegramNotifierOptions extends BaseNotifierOption<TelegramNotifier> {
    token: string;
    url?: string;
}

export class TelegramNotifier extends BaseNotifier<"Telegram"> {
    private readonly fetcher = new Fetcher();
    private currentToken: string | null = null;

    public constructor(private readonly options: TelegramNotifierOptions) {
        super("Telegram");
    }

    public async initialize(): Promise<void> {
        this.currentToken = await this.acquireToken();
    }
    public async notify(_: UserLog[], logMap: UserLogMap): Promise<void> {
        const reportTargets: UserLogType[] = [UserLogType.Follow, UserLogType.Unfollow, UserLogType.Rename];
        const content: Partial<Record<UserLogType, [string, number]>> = {};
        for (const type of reportTargets) {
            const logs = logMap[type];
            if (logs.length <= 0) {
                continue;
            }

            const template = CONTENT_TEMPLATES[type];
            if (!template) {
                throw new Error(`There is no message template for log type '${type}'`);
            }

            const [title, action] = template;
            //TODO: replace this to adjusting the length of the message by content not hard-coded
            let messageContent = logs.slice(0, MAXIMUM_LOG_COUNT).map(this.formatNotify).join("\n");
            if (logs.length > MAXIMUM_LOG_COUNT) {
                const remainCount = logs.length - MAXIMUM_LOG_COUNT;
                messageContent += `\n\n_... and ${remainCount} more_`;
            }

            const text = Logger.format(title, pluralize(action, logs.length, true), messageContent);
            content[type] = [text, logs.length];
        }

        await this.pushNotify({
            followers: content[UserLogType.Follow]?.[0],
            unfollowers: content[UserLogType.Unfollow]?.[0],
            renames: content[UserLogType.Rename]?.[0],
            followerCount: content[UserLogType.Follow]?.[1],
            unfollowerCount: content[UserLogType.Unfollow]?.[1],
            renameCount: content[UserLogType.Rename]?.[1],
        });
    }

    private getEndpoint(path: string) {
        const base = this.options.url || "https://cage-telegram.sophia-dev.io";
        return `${base}${path}`;
    }

    private async acquireToken() {
        const { token } = await this.fetcher.fetchJson<TokenResponse>({
            url: this.getEndpoint("/token"),
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            retryCount: 5,
            retryDelay: 0,
        });

        return token;
    }
    private async pushNotify(content: TelegramNotificationData) {
        while (true) {
            try {
                await this.fetcher.fetchJson<NotifyResponse>({
                    url: this.getEndpoint("/notify"),
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.currentToken}`,
                    },
                    data: {
                        token: this.options.token,
                        ...content,
                    },
                    retryCount: 5,
                    retryDelay: 0,
                });

                return;
            } catch (e) {
                if (e instanceof HttpError && e.statusCode === 403) {
                    this.currentToken = await this.acquireToken();
                    continue;
                }

                throw e;
            }
        }
    }
}
