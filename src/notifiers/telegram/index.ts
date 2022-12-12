import pluralize from "pluralize";

import { BaseNotifier } from "@notifiers/base";
import { BaseNotifierOption, NotifyPair } from "@notifiers/type";
import { TELEGRAM_LOG_COUNT } from "@notifiers/telegram/constants";
import { NotifyResponse, TelegramNotificationData, TokenResponse } from "@notifiers/telegram/types";

import { Fetcher } from "@utils/fetcher";
import { groupNotifies } from "@utils/groupNotifies";
import { Logger } from "@utils/logger";
import { HttpError } from "@utils/httpError";
import { generateNotificationTargets } from "@notifiers/telegram/utils";

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
    public async notify(logs: NotifyPair[]): Promise<void> {
        const { follow, unfollow, rename } = groupNotifies(logs);
        const targets = generateNotificationTargets({
            unfollowers: unfollow,
            followers: follow,
            renames: rename,
        });

        const notifyData: Partial<TelegramNotificationData> = {};
        for (const { fieldName, countFieldName, count, word, template, pairs } of targets) {
            if (count <= 0) {
                continue;
            }

            notifyData[countFieldName] = count;
            notifyData[fieldName] = Logger.format(
                template,
                count,
                pluralize(word, count),
                pairs.map(this.formatNotify).join("\n"),
                count > TELEGRAM_LOG_COUNT ? `_... and ${count - TELEGRAM_LOG_COUNT} more_` : "",
            ).trim();
        }

        await this.pushNotify(notifyData);
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
