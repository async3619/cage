import * as masto from "masto";

import { BaseWatcher, BaseWatcherOptions, PartialUser } from "@watchers/base";

export interface MastodonWatcherOptions extends BaseWatcherOptions<MastodonWatcher> {
    url: string;
    accessToken: string;
}

export class MastodonWatcher extends BaseWatcher<"Mastodon"> {
    private client: masto.mastodon.Client | null = null;
    private account: masto.mastodon.v1.Account | null = null;

    constructor(private readonly options: MastodonWatcherOptions) {
        super("Mastodon");
    }

    public async initialize(): Promise<void> {
        this.client = await masto.login({
            url: this.options.url,
            accessToken: this.options.accessToken,
        });

        this.account = await this.client.v1.accounts.lookup({
            acct: "@sophia_dev@silicon.moe",
        });

        return Promise.resolve(undefined);
    }

    protected async getFollowers(): Promise<PartialUser[]> {
        if (!this.client || !this.account) {
            throw new Error("Mastodon watcher has not initialized");
        }

        const { id, followersCount } = this.account;
        const result: PartialUser[] = [];
        for await (const followers of this.client.v1.accounts.listFollowers(id, { limit: 80 })) {
            const partialUsers = followers.map(follower => ({
                profileUrl: follower.url,
                uniqueId: follower.acct,
                displayName: follower.displayName,
                userId: follower.id,
            }));

            result.push(...partialUsers);
            if (result.length >= followersCount) {
                break;
            }
        }

        return result;
    }
}
