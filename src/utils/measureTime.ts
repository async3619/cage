import * as dayjs from "dayjs";

import { Work } from "@utils/type";

export async function measureTime(work: Work) {
    const startedAt = dayjs();
    await work();
    const endedAt = dayjs();

    return endedAt.diff(startedAt);
}
