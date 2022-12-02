import * as dayjs from "dayjs";

import { Work } from "@utils/type";

interface SucceededMeasureTimeResult<T> {
    readonly elapsedTime: number;
    readonly data: T;
}

interface FailedMeasureTimeResult {
    readonly elapsedTime: number;
    readonly exception: Error;
}

export type MeasureTimeResult<T> = SucceededMeasureTimeResult<T> | FailedMeasureTimeResult;

export async function measureTime<T>(work: Work<T>): Promise<MeasureTimeResult<T>> {
    const startedAt = dayjs();
    try {
        const result = await work();

        return {
            elapsedTime: dayjs().diff(startedAt),
            data: result,
        };
    } catch (e) {
        return {
            elapsedTime: dayjs().diff(startedAt),
            exception: e as Error,
        };
    }
}
