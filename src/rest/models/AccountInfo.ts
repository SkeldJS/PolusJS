import { AllPolusGameOptions } from "../../struct/PolusGameOptions";

export type AccountPerk =
    "lobby.code.custom" |
    "lobby.size.25" |
    "lobby.size.50" |
    "lobby.size.100" |
    "name.color.gold" |
    "name.color.match" |
    "player.color.rgb" |
    "server.access.dev" |
    "server.access.beta" |
    "server.access.creator" |
    "creator.manage" |
    "mod.kick" |
    "mod.ban";

export interface AccountSettings {
    "lobby.code.custom": string|null;
    "name.color.gold": boolean;
    "name.color.match": boolean;
}

export type AccountGameOptions = { version: 1 } & AllPolusGameOptions;

export interface AccountInfoModel {
    client_id: string;
    client_token: string;
    discord_id: string|null;
    display_name: string;
    created_at: string;
    name_change_available_at: string;
    banned: boolean;
    banned_until: string|null;
    muted: boolean;
    muted_until: string|null;
    perks: AccountPerk[];
    settings: AccountSettings;
    options: AccountGameOptions;
}