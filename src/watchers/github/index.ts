import nodeFetch from "node-fetch";
import { Client, CombinedError, createClient } from "@urql/core";

import { BaseWatcher, PartialUserData } from "@watchers/base";
import { FollowersDocument, MeDocument } from "@watchers/github/queries";
import { GitHubWatcherOptions } from "@watchers/github/types";

import { FollowersQuery, FollowersQueryVariables, MeQuery } from "@root/queries.data";
import { Nullable } from "@utils/types";

export class GitHubWatcher extends BaseWatcher<"GitHub"> {
    private client: Client;

    public constructor(private readonly options: GitHubWatcherOptions) {
        super("GitHub");

        this.client = createClient({
            url: "https://api.github.com/graphql",
            fetch: nodeFetch as unknown as typeof fetch,
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
    public async getFollowers() {
        try {
            const result: PartialUserData[] = [];
            const currentUserId = await this.getCurrentUserId();

            let cursor: string | undefined = undefined;
            while (true) {
                const [followers, nextCursor] = await this.getFollowersFromUserId(currentUserId, cursor);
                result.push(...followers);

                if (!nextCursor) {
                    break;
                }

                cursor = nextCursor;
            }

            return result;
        } catch (e) {
            if (e instanceof CombinedError) {
                if (e.networkError) {
                    throw e.networkError;
                } else if (e.graphQLErrors && e.graphQLErrors.length > 0) {
                    throw e.graphQLErrors[0];
                }
            } else {
                throw e;
            }
        }

        return [];
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
    private async getFollowersFromUserId(
        targetUserId: string,
        cursor?: string,
    ): Promise<[PartialUserData[], Nullable<string>]> {
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
                        uniqueId: edge.node.id,
                        userId: edge.node.login,
                        displayName: edge.node.name || edge.node.login,
                    };
                })
                .filter<PartialUserData>((item: PartialUserData | null): item is PartialUserData => Boolean(item)),
            data.user.followers.pageInfo.endCursor,
        ];
    }
}
