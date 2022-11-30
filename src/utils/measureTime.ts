import * as dayjs from "dayjs";

import { Work } from "@utils/type";

interface MeasureTimeResult {
    readonly elapsedTime: number;
    readonly exception?: Error;
}

export async function measureTime(work: Work): Promise<MeasureTimeResult> {
    const startedAt = dayjs();
    try {
        await work();
    } catch (e) {
        return {
            elapsedTime: dayjs().diff(startedAt),
            exception: e as Error,
        };
    }

    return {
        elapsedTime: dayjs().diff(startedAt),
    };
}
