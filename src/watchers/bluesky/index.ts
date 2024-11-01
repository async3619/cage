import { BskyAgent } from "@atproto/api";

import { BaseWatcher, BaseWatcherOptions, PartialUser } from "@watchers/base";

export interface BlueSkyWatcherOptions extends BaseWatcherOptions<BlueSkyWatcher> {
    service?: string;
    email: string;
    password: string;
}

export class BlueSkyWatcher extends BaseWatcher<"BlueSky"> {
    private agent: BskyAgent | null = null;
    private userId: string | null = null;

    constructor(private readonly options: BlueSkyWatcherOptions) {
        super("BlueSky");
    }

    public async initialize(): Promise<void> {
        this.agent = new BskyAgent({ service: this.options.service || "https://bsky.social" });

        const response = await this.agent.login({
            identifier: this.options.email,
            password: this.options.password,
        });

        this.userId = response.data.did;
    }

    protected async getFollowers(): Promise<PartialUser[]> {
        if (!this.agent || !this.userId) {
            throw new Error("Bluesky watcher has not initialized");
        }

        let cursor: string | undefined = undefined;
        const result: PartialUser[] = [];
        while (true) {
            const { data } = await this.agent.getFollowers({
                actor: this.userId,
                limit: 100,
                cursor,
            });

            cursor = data.cursor;
            for (const follower of data.followers) {
                result.push({
                    uniqueId: follower.did,
                    userId: follower.handle,
                    displayName: follower.displayName || follower.handle,
                    profileUrl: `https://bsky.app/profile/${follower.handle}`,
                });
            }

            if (data.followers.length < 100) {
                break;
            }
        }

        return result;
    }
}
