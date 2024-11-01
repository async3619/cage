import gql from "graphql-tag";

export const FollowersDocument = gql`
    query followers($username: String!, $cursor: String) {
        user(login: $username) {
            followers(first: 100, after: $cursor) {
                totalCount
                edges {
                    node {
                        id
                        login
                        name
                    }
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
        rateLimit {
            limit
            cost
            remaining
            resetAt
        }
    }
`;

export const MeDocument = gql`
    query me {
        viewer {
            id
            login
        }
    }
`;
