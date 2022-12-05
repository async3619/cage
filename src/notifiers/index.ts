import { BaseNotifier } from "@notifiers/base";
import { DiscordNotifier, DiscordNotifierOptions } from "@notifiers/discord";
import { TypeMap } from "@utils/types";

export type NotifierOptions = DiscordNotifierOptions;
export type NotifierOptionMap = TypeMap<NotifierOptions>;

export const AVAILABLE_NOTIFIERS: ReadonlyArray<BaseNotifier> = [new DiscordNotifier()];
