import { AsyncFn } from "@utils/types";
import { sleep } from "@utils/sleep";

type Task<TData> = Promise<TData> | AsyncFn<void, TData>;

export async function throttle<TData>(task: Task<TData>, waitFor: number): Promise<TData>;
export async function throttle<TData>(
    task: Task<TData>,
    waitFor: number,
    elapsedTime: boolean,
): Promise<[TData, number]>;

export async function throttle<TData>(
    task: Task<TData>,
    waitFor: number,
    elapsedTime = false,
): Promise<TData | [TData, number]> {
    const startedAt = Date.now();
    const [result] = await Promise.all([typeof task === "function" ? task() : task, await sleep(waitFor)]);

    if (elapsedTime) {
        return [result, Date.now() - startedAt];
    }

    return result;
}
