import { Logger } from "@utils/logger";

export type Fn<TArgs = void, TReturn = void> = TArgs extends unknown[]
    ? (...arg: TArgs) => TReturn
    : TArgs extends void
    ? () => TReturn
    : (...arg: [TArgs]) => TReturn;
export type AsyncFn<TArgs = void, TReturn = void> = Fn<TArgs, Promise<TReturn>>;
export type Work<T> = Fn<void, Promise<T> | T>;
export type Nullable<T> = T | null | undefined;

export interface Serializable {
    serialize(): Record<string, any>;
}

export interface Hydratable {
    hydrate(data: Record<string, any>): void;
}

export abstract class Loggable {
    protected readonly logger: Logger;

    protected constructor(protected readonly name: string) {
        this.logger = new Logger(name);
    }
}
