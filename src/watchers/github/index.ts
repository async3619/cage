import nodeFetch from "node-fetch";
import { Client, CombinedError, createClient } from "@urql/core";

import { BaseWatcher, BaseWatcherOptions, PartialUser } from "@watchers/base";
import { FollowersDocument, MeDocument } from "@watchers/github/queries";

import { FollowersQuery, FollowersQueryVariables, MeQuery } from "@root/queries.data";
import { isRequired } from "@utils/isRequired";
import { Nullable } from "@utils/types";

export interface GitHubWatcherOptions extends BaseWatcherOptions<GitHubWatcher> {
    authToken: string;
}

const isPartialUser = (user: PartialUser | null): user is PartialUser => Boolean(user);

export class GitHubWatcher extends BaseWatcher<"GitHub"> {
    private client: Client;

    public constructor(private readonly options: GitHubWatcherOptions) {
        super("GitHub");

        this.client = createClient({
            url: "https://api.github.com/graphql",
            fetch: nodeFetch as unknown as typeof fetch,
            requestPolicy: "network-only",
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

    protected async getFollowers() {
        try {
            const result: PartialUser[] = [];
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
            }

            throw e;
        }
    }

    private async getCurrentUserId() {
        const { data, error } = await this.client.query<MeQuery>(MeDocument, {}).toPromise();
        if (error) {
            throw error;
        } else if (!data) {
            throw new Error("No data returned from Me query");
        }

        return data.viewer.login;
    }
    private async getFollowersFromUserId(
        targetUserId: string,
        cursor?: string,
    ): Promise<[PartialUser[], Nullable<string>]> {
        const { data, error } = await this.client
            .query<FollowersQuery, FollowersQueryVariables>(FollowersDocument, { username: targetUserId, cursor })
            .toPromise();

        if (error) {
            throw error;
        } else if (!data?.user?.followers?.edges) {
            throw new Error("No followers returned from Followers query");
        }

        return [
            data.user.followers.edges
                .map(edge => edge?.node)
                .filter(isRequired)
                .map<PartialUser | null>(node => ({
                    uniqueId: node.id,
                    userId: node.login,
                    displayName: node.name || node.login,
                    profileUrl: `https://github.com/${node.login}`,
                }))
                .filter<PartialUser>(isPartialUser),
            data.user.followers.pageInfo.endCursor,
        ];
    }
}
