import { Client, createClient } from "@urql/core";

import { UserData } from "@repositories/models/user";

import { GitHubWatcherOptions } from "@watchers/github/types";
import { BaseWatcher } from "@watchers/base";
import { FollowersQuery, FollowersQueryVariables, MeQuery } from "@root/queries.data";
import { FollowersDocument, MeDocument } from "@watchers/github/queries";
import { Nullable } from "@utils/types";

export class GitHubWatcher extends BaseWatcher<"GitHub"> {
    private client: Client;

    public constructor(private readonly options: GitHubWatcherOptions) {
        super("GitHub");

        this.client = createClient({
            url: "https://api.github.com/graphql",
            fetchOptions: () => {
                return {
                    method: "POST",
                    headers: {
                        authorization: `token ${this.options.authToken}`,
                    },
                };
            },
        });
    }

    public async initialize() {
        return;
    }
    public async doWatch(): Promise<UserData[]> {
        const result: UserData[] = [];
        const currentUserId = await this.getCurrentUserId();

        let cursor: string | undefined = undefined;
        while (true) {
            const [followers, nextCursor] = await this.getFollowers(currentUserId, cursor);
            result.push(...followers);

            if (!nextCursor) {
                break;
            }

            cursor = nextCursor;
        }

        return result;
    }

    private async getCurrentUserId() {
        const { data, error } = await this.client.query<MeQuery>(MeDocument, {}).toPromise();
        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error("No data returned from Me query");
        }

        return data.viewer.login;
    }
    private async getFollowers(targetUserId: string, cursor?: string): Promise<[UserData[], Nullable<string>]> {
        const { data, error } = await this.client
            .query<FollowersQuery, FollowersQueryVariables>(FollowersDocument, {
                username: targetUserId,
                cursor,
            })
            .toPromise();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error("No data returned from Followers query");
        }

        if (!data.user) {
            throw new Error("No user returned from Followers query");
        }

        if (!data.user.followers.edges) {
            throw new Error("No followers returned from Followers query");
        }

        return [
            data.user.followers.edges
                .map(edge => {
                    if (!edge?.node) {
                        return null;
                    }

                    return {
                        from: this.getName(),
                        uniqueId: edge.node.id,
                        userId: edge.node.login,
                        displayName: edge.node.name || edge.node.login,
                    };
                })
                .filter<UserData>((item: UserData | null): item is UserData => Boolean(item)),
            data.user.followers.pageInfo.endCursor,
        ];
    }

    protected getHashData(): any {
        return this.options.authToken;
    }

    protected hydrate(data: GitHubWatcherOptions): void {
        this.options.authToken = data.authToken;
    }
    protected serialize(): GitHubWatcherOptions {
        return this.options;
    }
}
