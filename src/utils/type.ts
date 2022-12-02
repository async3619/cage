import type { TWITTER_PROVIDER_ENV_KEYS } from "@watchers/twitter";
import { Logger } from "@utils/logger";

export type Fn<TArg extends unknown[] = [], TReturn = unknown> = (...arg: TArg) => TReturn;
export type Work<T> = Fn<[], Promise<T> | T>;
export type Nullable<T> = T | null | undefined;

export type KnownEnvKeys = `CAGE_${TWITTER_PROVIDER_ENV_KEYS}`;
export type Env = {
    [key in KnownEnvKeys]?: string | undefined;
};

export interface ProviderInitializeContext {
    readonly env: Readonly<Env>;
}

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
