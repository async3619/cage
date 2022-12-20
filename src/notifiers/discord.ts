import pluralize from "pluralize";
import dayjs from "dayjs";

import { UserLog, UserLogType } from "@repositories/models/user-log";

import { BaseNotifier } from "@notifiers/base";
import { BaseNotifierOption, UserLogMap } from "@notifiers/type";

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
    public async notify(logs: UserLog[], logMap: UserLogMap) {
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
                    // use dayjs to generate timestamp with Z format
                    timestamp: dayjs().format(),
                },
            ],
            attachments: [],
        };

        const fields: DiscordWebhookData["embeds"][0]["fields"] = [];
        const followerLogs = logMap[UserLogType.Follow];
        const unfollowerLogs = logMap[UserLogType.Unfollow];
        const renameLogs = logMap[UserLogType.Rename];
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
        logs: UserLog[],
        messageFormat: string,
        word: string,
    ): DiscordWebhookData["embeds"][0]["fields"][0] {
        const message = Logger.format(messageFormat, logs.length, pluralize(word, logs.length));
        const { name, value } = this.generateEmbedField(logs, message);
        const valueLines = [value];
        if (logs.length > 10) {
            valueLines.push(`_... and ${logs.length - 10} more_`);
        }

        return {
            name,
            value: valueLines.join("\n"),
        };
    }
    private generateEmbedField(logs: UserLog[], title: string) {
        return {
            name: title,
            value: logs.slice(0, 10).map(this.formatNotify).join("\n"),
        };
    }
}
