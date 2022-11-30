import type { TWITTER_PROVIDER_ENV_KEYS } from "@watchers/twitter";

export type Fn<TArg extends unknown[] = [], TReturn = unknown> = (...arg: TArg) => TReturn;
export type Work = Fn<[], Promise<void> | void>;

export type KnownEnvKeys = `CAGE_${TWITTER_PROVIDER_ENV_KEYS}`;
export type Env = {
    [key in KnownEnvKeys]?: string | undefined;
};

export interface ProviderInitializeContext {
    readonly env: Readonly<Env>;
}

export interface Follower {
    readonly id: string;
    readonly screenName: string;
}

export interface Serializable {
    serialize(): Record<string, any>;
}

export interface Hydratable {
    hydrate(data: Record<string, any>): void;
}
