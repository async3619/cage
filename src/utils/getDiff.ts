import { mapBy } from "@utils/mapBy";
import { Values } from "@utils/types";

type KeysOnlyString<TData extends Record<keyof TData, unknown>> = Values<{
    [TKey in keyof TData]: TData[TKey] extends string ? TKey : never;
}>;

export function getDiff<TData extends Record<keyof TData, unknown>>(
    newData: TData[],
    oldData: TData[],
    uniqueKey: KeysOnlyString<TData>,
    key: keyof TData,
): TData[] {
    const oldDataMap = mapBy(oldData, uniqueKey);

    return newData.filter(item => {
        const oldUser = oldDataMap[item[uniqueKey] as string];
        return oldUser && oldUser[key] !== item[key];
    });
}
