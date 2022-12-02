import * as _ from "lodash";

import { Follower } from "@models/follower";

export function getFollowerDiff(oldFollowers: Follower[], newFollowers: Follower[]) {
    const oldFollowerMap = _.chain(oldFollowers).keyBy("id").value();
    const newFollowerMap = _.chain(newFollowers).keyBy("id").value();

    // get old & new follower ids in different variable
    const oldFollowerIds = oldFollowers.map(follower => follower.id);
    const newFollowerIds = newFollowers.map(follower => follower.id);

    // get new follower ids
    const newFollowerIdsOnly = newFollowerIds.filter(id => !oldFollowerIds.includes(id));

    // get removed follower ids
    const removedFollowerIdsOnly = oldFollowerIds.filter(id => !newFollowerIds.includes(id));

    return {
        added: newFollowerIdsOnly.map(id => newFollowerMap[id]),
        removed: removedFollowerIdsOnly.map(id => oldFollowerMap[id]),
    };
}
