import pluralize from "pluralize";
import dayjs from "dayjs";

import { UserLogType } from "@repositories/models/user-log";

import { BaseNotifier } from "@notifiers/base";
import { BaseNotifierOption, NotifyPair } from "@notifiers/type";

import { Fetcher } from "@utils/fetcher";
import { Logger } from "@utils/logger";

export interface DiscordNotifierOptions extends BaseNotifierOption<DiscordNotifier> {
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

export class DiscordNotifier extends BaseNotifier<"Discord"> {
    private readonly fetcher = new Fetcher();
    private webhookUrl: string | null = null;

    public constructor(private readonly options: DiscordNotifierOptions) {
        super("Discord");
    }

    public async initialize() {
        this.webhookUrl = this.options.webhookUrl;
    }
    public async notify(pairs: NotifyPair[]) {
        if (!this.webhookUrl) {
            throw new Error("DiscordNotifier is not initialized");
        }

        if (pairs.length <= 0) {
            return;
        }

        const data: DiscordWebhookData = {
            content: null,
            embeds: [
                {
                    title: Logger.format(
                        "Total {} {} {} found",
                        pairs.length,
                        pluralize("change", pairs.length),
                        pluralize("was", pairs.length),
                    ),
                    color: 5814783,
                    fields: [],
                    author: {
                        name: "Cage Report",
                    },
                    // use dayjs to generate timestamp with Z format
                    timestamp: dayjs().format(),
                },
            ],
            attachments: [],
        };

        const fields: DiscordWebhookData["embeds"][0]["fields"] = [];
        const followerLogs = pairs.filter(([, l]) => l.type === UserLogType.Follow);
        const unfollowerLogs = pairs.filter(([, l]) => l.type === UserLogType.Unfollow);
        const renameLogs = pairs.filter(
            ([, l]) => l.type === UserLogType.RenameUserId || l.type === UserLogType.RenameDisplayName,
        );

        if (followerLogs.length > 0) {
            fields.push(this.composeLogs(followerLogs, "🎉 {} new {}", "follower"));
        }

        if (unfollowerLogs.length > 0) {
            fields.push(this.composeLogs(unfollowerLogs, "❌ {} {}", "unfollower"));
        }

        if (renameLogs.length > 0) {
            fields.push(this.composeLogs(renameLogs, "✏️ {} {}", "rename"));
        }

        data.embeds[0].fields.push(...fields);

        await this.fetcher.fetch({
            url: this.webhookUrl,
            method: "POST",
            data,
        });
    }

    private composeLogs(
        logs: NotifyPair[],
        messageFormat: string,
        word: string,
    ): DiscordWebhookData["embeds"][0]["fields"][0] {
        const { name, value } = this.generateEmbedField(
            logs,
            Logger.format(messageFormat, logs.length, pluralize(word, logs.length)),
        );

        const valueLines = [value];
        if (logs.length > 10) {
            valueLines.push(`_... and ${logs.length - 10} more_`);
        }

        return {
            name,
            value: valueLines.join("\n"),
        };
    }
    private generateEmbedField(logs: NotifyPair[], title: string) {
        return {
            name: title,
            value: logs.slice(0, 10).map(this.formatNotify).join("\n"),
        };
    }
}
