import { Cursor, Rettiwt, User } from "rettiwt-api";

import { BaseWatcher, BaseWatcherOptions, PartialUser } from "@watchers/base";

export interface TwitterWatcherOptions extends BaseWatcherOptions<TwitterWatcher> {
    apiKey: string;
    username: string;
}

export class TwitterWatcher extends BaseWatcher<"Twitter"> {
    private readonly twitterClient: Rettiwt;
    private readonly currentUserName: string;

    private currentUserId: string | null = null;

    public constructor({ apiKey, username }: TwitterWatcherOptions) {
        super("Twitter");
        this.twitterClient = new Rettiwt({ apiKey });
        this.currentUserName = username;
    }

    public async initialize() {
        const data = await this.twitterClient.user.details(this.currentUserName);
        if (!data) {
            throw new Error("Failed to get user id");
        }

        this.logger.verbose("Successfully initialized with user id {}", [data.id]);
        this.currentUserId = data.id;
    }

    protected async getFollowers(): Promise<PartialUser[]> {
        if (!this.currentUserId) {
            throw new Error("Watcher is not initialized");
        }

        const users: User[] = [];
        let cursor: Cursor | null = null;
        while (true) {
            const followers = await this.twitterClient.user.followers(this.currentUserId, 100, cursor?.value);
            if (!followers.next.value || followers.list.length === 0) {
                break;
            }

            users.push(...followers.list);
            cursor = followers.next;
        }

        return users.map(user => ({
            uniqueId: user.id,
            displayName: user.fullName,
            userId: user.userName,
            profileUrl: `https://twitter.com/${user.userName}`,
        }));
    }
}
