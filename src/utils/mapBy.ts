import { Fn } from "@utils/types";

export function mapBy<TData extends Record<keyof TData, unknown>, TKey extends keyof TData>(
    data: TData[],
    key: TKey | Fn<TData, string>,
): Record<string, TData>;
export function mapBy<TData extends Record<keyof TData, unknown>, TKey extends keyof TData, TValue = unknown>(
    data: TData[],
    key: TKey | Fn<TData, string>,
    mapFn: Fn<TData, TValue>,
): Record<string, TValue>;

export function mapBy<TData extends Record<keyof TData, unknown>, TKey extends keyof TData, TValue = unknown>(
    data: TData[],
    key: TKey | Fn<TData, TKey>,
    mapFn?: Fn<TData, TValue>,
): Record<string, TData> | Record<string, TValue> {
    return data.reduce((acc, item) => {
        const itemKey = typeof key === "function" ? key(item) : item[key];
        acc[itemKey as string] = mapFn ? mapFn(item) : item;

        return acc;
    }, {} as Record<string, TData> | Record<string, TValue>);
}
