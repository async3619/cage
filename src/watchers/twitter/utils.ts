import {
    AddEntryInstruction,
    FollowerAPIResponse,
    TimelineCursorContent,
    TimelineItemContent,
} from "@watchers/twitter/types";

export function findAddEntryInstructionFromFollower(follower: FollowerAPIResponse): AddEntryInstruction | null {
    const { instructions } = follower.data.user.result.timeline.timeline;
    const addEntryInstruction = instructions.find(instruction => instruction.type === "TimelineAddEntries") as
        | AddEntryInstruction
        | undefined;

    if (!addEntryInstruction) {
        return null;
    }

    return addEntryInstruction;
}

export function findBottomCursorFromFollower(response: FollowerAPIResponse) {
    const addEntryInstruction = findAddEntryInstructionFromFollower(response);
    if (!addEntryInstruction) {
        return null;
    }

    const entries = addEntryInstruction.entries;
    const cursors = entries
        .map(entry => entry.content)
        .filter((content): content is TimelineCursorContent => {
            return content.entryType === "TimelineTimelineCursor";
        });

    const bottomCursor = cursors.find(cursor => cursor.cursorType === "Bottom");
    if (!bottomCursor) {
        return null;
    }

    return bottomCursor.value;
}

export function findUserDataFromFollower(response: FollowerAPIResponse) {
    const addEntryInstruction = findAddEntryInstructionFromFollower(response);
    if (!addEntryInstruction) {
        return null;
    }

    const entries = addEntryInstruction.entries;
    return entries
        .map(entry => entry.content)
        .filter((content): content is TimelineItemContent => {
            return content.entryType === "TimelineTimelineItem";
        })
        .map(content => content.itemContent.user_results.result);
}
