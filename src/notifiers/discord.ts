import pluralize from "pluralize";

import { UserLog, UserLogType } from "@repositories/models/user-log";

import { BaseNotifier } from "@notifiers/base";

import { Fetcher } from "@utils/fetcher";
import { Logger } from "@utils/logger";

export interface DiscordNotifierOptions {
    type: "discord";
    webhookUrl: string;
}

interface DiscordWebhookData {
    content: any;
    embeds: {
        title: string;
        color: number;
        fields: {
            name: string;
            value: string;
        }[];
        author: {
            name: string;
        };
        timestamp: string;
    }[];
    attachments: [];
}

export class DiscordNotifier extends BaseNotifier {
    private readonly fetcher = new Fetcher();
    private webhookUrl: string | null = null;

    public constructor() {
        super(DiscordNotifier.name);
    }

    public async initialize(options: DiscordNotifierOptions) {
        this.webhookUrl = options.webhookUrl;
    }

    public async notify(logs: UserLog[]) {
        if (!this.webhookUrl) {
            throw new Error("DiscordNotifier is not initialized");
        }

        if (logs.length <= 0) {
            return;
        }

        const data: DiscordWebhookData = {
            content: null,
            embeds: [
                {
                    title: Logger.format(
                        "Total {} {} {} found",
                        logs.length,
                        pluralize("change", logs.length),
                        pluralize("was", logs.length),
                    ),
                    color: 5814783,
                    fields: [],
                    author: {
                        name: "Cage Report",
                    },
                    timestamp: "2022-12-29T15:00:00.000Z",
                },
            ],
            attachments: [],
        };

        const newFields: DiscordWebhookData["embeds"][0]["fields"] = [];
        const followerLogs = logs.filter(l => l.type === UserLogType.Follow);
        if (followerLogs.length > 0) {
            const field = this.generateEmbedField(
                followerLogs,
                Logger.format("🎉 {} new {}", followerLogs.length, pluralize("follower", logs.length)),
            );

            newFields.push(field);
        }

        const unfollowerLogs = logs.filter(l => l.type === UserLogType.Unfollow);
        if (unfollowerLogs.length > 0) {
            const field = this.generateEmbedField(
                unfollowerLogs,
                Logger.format("❌ {} {}", followerLogs.length, pluralize("unfollower", logs.length)),
            );

            newFields.push(field);
        }

        data.embeds[0].fields.push(...newFields);

        await this.fetcher.fetch({
            url: this.webhookUrl,
            method: "POST",
            data,
        });
    }

    private generateEmbedField(logs: UserLog[], title: string) {
        return {
            name: title,
            value: logs
                .map(l => l.user)
                .slice(0, 10)
                .map(user => {
                    return Logger.format(
                        "[{} (@{})](https://twitter.com/{})",
                        user.displayName,
                        user.userId,
                        user.userId,
                    );
                })
                .join("\n"),
        };
    }
}
