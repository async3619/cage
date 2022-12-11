import pluralize from "pluralize";
import { capitalCase } from "change-case";

import { UserLogType } from "@repositories/models/user-log";

import { BaseNotifier } from "@notifiers/base";
import {
    FORBIDDEN_CHARACTERS,
    TELEGRAM_FOLLOWERS_TEMPLATE,
    TELEGRAM_LOG_COUNT,
    TELEGRAM_RENAMES_TEMPLATE,
    TELEGRAM_UNFOLLOWERS_TEMPLATE,
} from "@notifiers/telegram/constants";
import { BaseNotifierOption, NotifyPair } from "@notifiers/type";

import { Fetcher } from "@utils/fetcher";
import { groupNotifies } from "@utils/groupNotifies";
import { Logger } from "@utils/logger";
import { HttpError } from "@utils/httpError";

export interface TelegramNotifierOptions extends BaseNotifierOption<TelegramNotifier> {
    token: string;
    url?: string;
}

interface TokenResponse {
    token: string;
    expires: number;
}
interface NotifyResponse {
    success: boolean;
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
        const targets: [NotifyPair[], number, string, string][] = [
            [follow.slice(0, TELEGRAM_LOG_COUNT), follow.length, "new follower", TELEGRAM_FOLLOWERS_TEMPLATE],
            [unfollow.slice(0, TELEGRAM_LOG_COUNT), unfollow.length, "unfollower", TELEGRAM_UNFOLLOWERS_TEMPLATE],
            [rename.slice(0, TELEGRAM_LOG_COUNT), rename.length, "rename", TELEGRAM_RENAMES_TEMPLATE],
        ];

        const resultMessages: string[] = [];
        for (const [target, count, word, template] of targets) {
            if (target.length <= 0) {
                continue;
            }

            const message = Logger.format(
                template,
                count,
                pluralize(word, count),
                target.map(this.formatNotify).join("\n"),
                count > TELEGRAM_LOG_COUNT ? `_\\.\\.\\. and ${count - TELEGRAM_LOG_COUNT} more_` : "",
            ).trim();

            resultMessages.push(message);
        }

        if (resultMessages.length > 0) {
            const titleItems = targets.map(([, count, word]) => {
                return count > 0 ? `${count} ${pluralize(capitalCase(word), count)}\n` : "";
            });
            const title = Logger.format("*🦜 Cage Report*\n\n{}{}{}", ...titleItems).trim();

            await this.pushNotify([title, ...resultMessages]);
        }
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
    private async pushNotify(content: string[]) {
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
                        content,
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

    protected escapeTexts(texts: string[]) {
        return texts.map(text => this.escapeText(text));
    }
    protected escapeText(text: string) {
        for (const ch of FORBIDDEN_CHARACTERS) {
            text = text.replace(new RegExp(`\\${ch}`, "g"), `\\${ch}`);
        }

        return text;
    }

    protected formatNotify = (pair: NotifyPair): string => {
        const [watcher, log] = pair;
        const { user } = log;

        if (log.type === UserLogType.RenameUserId || log.type === UserLogType.RenameDisplayName) {
            const tokens = this.escapeTexts([
                watcher.getName(),
                log.oldDisplayName || "",
                log.oldUserId || "",
                watcher.getProfileUrl(log.user),
                log.type === UserLogType.RenameDisplayName ? "" : "@",
                log.type === UserLogType.RenameUserId ? user.userId : user.displayName,
            ]);

            return Logger.format("\\[{}\\] [{} (@{})]\\({}\\) → {}{}", ...tokens);
        }

        const tokens = this.escapeTexts([
            watcher.getName(),
            user.displayName,
            user.userId,
            watcher.getProfileUrl(user),
        ]);

        return Logger.format("\\[{}\\] [{} \\(@{}\\)]({})", ...tokens);
    };
}
