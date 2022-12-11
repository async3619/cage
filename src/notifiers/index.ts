import { BaseNotifier } from "@notifiers/base";
import { DiscordNotifier, DiscordNotifierOptions } from "@notifiers/discord";
import { TelegramNotifier, TelegramNotifierOptions } from "@notifiers/telegram";
import { BaseNotifierOption } from "@notifiers/type";

import { TypeMap } from "@utils/types";

export type NotifierClasses = DiscordNotifier | TelegramNotifier;
export type NotifierTypes = Lowercase<NotifierClasses["name"]>;

export type NotifierOptions = DiscordNotifierOptions | TelegramNotifierOptions;
export type NotifierOptionMap = TypeMap<NotifierOptions>;

export type NotifierMap = {
    [TKey in NotifierTypes]: TKey extends NotifierTypes ? Extract<NotifierClasses, { name: TKey }> : never;
};
export type NotifierFactoryMap = {
    [TKey in NotifierTypes]: TKey extends NotifierTypes
        ? (options: NotifierOptionMap[TKey]) => Extract<NotifierClasses, { name: Capitalize<TKey> }>
        : never;
};
export type NotifierPair = [NotifierTypes, BaseNotifier<string>];

const AVAILABLE_NOTIFIERS: Readonly<NotifierFactoryMap> = {
    discord: options => new DiscordNotifier(options),
    telegram: options => new TelegramNotifier(options),
};

export const createNotifier = (options: BaseNotifierOption): BaseNotifier<string> => {
    const { type } = options;

    return AVAILABLE_NOTIFIERS[type](options);
};
