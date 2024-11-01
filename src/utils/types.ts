import { Logger } from "@utils/logger";

export type Resolve<T> = T extends Promise<infer U> ? U : T;

export type SelectOnly<Record, Type extends Record[keyof Record]> = {
    [Key in keyof Required<Record> as Required<Record>[Key] extends Type ? Key : never]: Record[Key];
};
export type TypeMap<T extends { type: string }> = {
    [TKey in T["type"]]: TKey extends T["type"] ? Extract<T, { type: TKey }> : never;
};

export type Values<T> = T[keyof T];

export type Fn<TArgs = void, TReturn = void> = TArgs extends unknown[]
    ? (...arg: TArgs) => TReturn
    : TArgs extends void
    ? () => TReturn
    : (...arg: [TArgs]) => TReturn;
export type AsyncFn<TArgs = void, TReturn = void> = Fn<TArgs, Promise<TReturn>>;
export type Work<T> = Fn<void, Promise<T> | T>;
export type Nullable<T> = T | null | undefined;

export interface Serializable {
    serialize(): Record<string, unknown>;
}
export interface Hydratable {
    hydrate(data: Record<string, any>): void;
}

export abstract class Loggable<TName extends string = string> {
    protected readonly logger: Logger;

    protected constructor(public readonly name: TName) {
        this.logger = new Logger(name);
    }

    public getName(): string {
        return this.name;
    }
}
