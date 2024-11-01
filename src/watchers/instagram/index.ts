import { BaseWatcher, BaseWatcherOptions, PartialUser } from "@watchers/base";
import { IgApiClient } from "instagram-private-api";
import { Resolve, sleep } from "@utils";

export interface InstagramWatcherOptions extends BaseWatcherOptions<InstagramWatcher> {
    username: string;
    password: string;
    targetUserName: string;
    requestDelay?: number;
}

export class InstagramWatcher extends BaseWatcher<"Instagram"> {
    private readonly client = new IgApiClient();

    private readonly username: string;
    private readonly password: string;
    private readonly targetUserName: string;
    private readonly requestDelay: number;

    private loggedInUser: Resolve<ReturnType<typeof this.client.account.login>> | null = null;

    public constructor({ username, password, targetUserName, requestDelay = 1000 }: InstagramWatcherOptions) {
        super("Instagram");

        this.username = username;
        this.password = password;
        this.targetUserName = targetUserName;
        this.requestDelay = requestDelay;
    }

    public async initialize() {
        this.client.state.generateDevice(this.username);
        await this.client.simulate.preLoginFlow();

        this.loggedInUser = await this.client.account.login(this.username, this.password);

        this.logger.verbose("Successfully initialized with user name {}", [this.loggedInUser.username]);
    }

    protected async getFollowers() {
        // get followers
        const id = await this.client.user.getIdByUsername(this.targetUserName);
        if (!id) {
            throw new Error("Failed to get user id");
        }

        const followersFeed = this.client.feed.accountFollowers(id);
        const followers: PartialUser[] = [];
        while (true) {
            const items = await followersFeed.items();
            followers.push(
                ...items.map(user => ({
                    uniqueId: user.pk.toString(),
                    displayName: user.full_name,
                    userId: user.username,
                    profileUrl: `https://instagram.com/${user.username}`,
                })),
            );

            if (!followersFeed.isMoreAvailable()) {
                break;
            }

            await sleep(this.requestDelay);
        }

        return followers;
    }
}
