export interface FollowerAPIResponse {
    data: {
        user: {
            result: {
                __typename: string;
                timeline: {
                    timeline: {
                        instructions: Array<AddEntryInstruction | OtherInstruction>;
                    };
                };
            };
        };
    };
}
export interface AddEntryInstruction {
    type: "TimelineAddEntries";
    entries: InstructionEntry[];
}
export interface OtherInstruction {
    type: "TimelineClearCache" | "TimelineTerminateTimeline";
}
export interface InstructionEntry {
    entryId: string;
    sortIndex: string;
    content: TimelineItemContent | TimelineCursorContent;
}
export interface FollowerUser {
    rest_id: string;
    legacy: {
        blocked_by: boolean;
        blocking: boolean;
        can_dm: boolean;
        can_media_tag: boolean;
        created_at: string;
        default_profile: boolean;
        default_profile_image: boolean;
        description: string;
        fast_followers_count: number;
        favourites_count: number;
        follow_request_sent: boolean;
        followed_by: boolean;
        followers_count: number;
        following: boolean;
        friends_count: number;
        has_custom_timelines: boolean;
        is_translator: boolean;
        listed_count: number;
        location: string;
        media_count: number;
        muting: boolean;
        name: string;
        normal_followers_count: number;
        notifications: boolean;
        possibly_sensitive: boolean;
        profile_banner_url: string;
        profile_image_url_https: string;
        profile_interstitial_type: string;
        protected: boolean;
        screen_name: string;
        statuses_count: number;
        translator_type: string;
        verified: boolean;
        want_retweets: boolean;
    };
}
export interface TimelineItemContent {
    entryType: "TimelineTimelineItem";
    itemContent: {
        user_results: {
            result: FollowerUser;
        };
    };
}
export interface TimelineCursorContent {
    entryType: "TimelineTimelineCursor";
    cursorType: "Bottom" | "Top";
    value: string;
}
