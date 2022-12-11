import { IncomingWebhook, IncomingWebhookSendArguments } from "@slack/webhook";

import { BaseNotifier } from "@notifiers/base";
import { BaseNotifierOption, NotifyPair } from "@notifiers/type";

import { groupNotifies } from "@utils/groupNotifies";
import { Logger } from "@utils/logger";

export interface SlackNotifierOptions extends BaseNotifierOption<SlackNotifier> {
    webhookUrl: string;
}

const MAX_ITEMS_PER_MESSAGE = 25;

export class SlackNotifier extends BaseNotifier<"Slack"> {
    private readonly webhook: IncomingWebhook;

    public constructor(private readonly options: SlackNotifierOptions) {
        super("Slack");

        this.webhook = new IncomingWebhook(this.options.webhookUrl);
    }

    public async initialize(): Promise<void> {
        return;
    }
    public async notify(logs: NotifyPair[]): Promise<void> {
        const { follow, unfollow, rename } = groupNotifies(logs);
        const targets: [NotifyPair[], number, string, string][] = [
            [follow.slice(0, MAX_ITEMS_PER_MESSAGE), follow.length, "🎉 {} new {}", "follower"],
            [unfollow.slice(0, MAX_ITEMS_PER_MESSAGE), unfollow.length, "❌ {} {}", "unfollower"],
            [rename.slice(0, MAX_ITEMS_PER_MESSAGE), rename.length, "✏️ {} {}", "rename"],
        ];

        const result: IncomingWebhookSendArguments = {
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: "_*🦜 Cage Report*_",
                    },
                },
            ],
        };

        for (const [logs, count, template, word] of targets) {
            if (logs.length <= 0) {
                continue;
            }

            const title = Logger.format(template, count, word);
            const userContents = logs.map(this.formatNotify).join("\n");
            let moreText = "";
            if (count > MAX_ITEMS_PER_MESSAGE) {
                moreText = Logger.format("... and {} more", count - MAX_ITEMS_PER_MESSAGE);
            }

            const content = `*${title}*\n${userContents}\n${moreText}`.trim();
            if (!result.blocks) {
                continue;
            }

            result.blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: content,
                },
            });
        }

        await this.webhook.send(result);
    }

    protected formatNotify(pair: NotifyPair): string {
        return super.formatNotify(pair).replace(/ \[(.*? \(@.*?\))\]\((.*?)\)/g, "<$2|$1>");
    }
}
