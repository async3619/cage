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
