import { AccountGameOptions, AccountInfoModel, AccountPerk, AccountSettings } from "../rest";

export class AccountInfo {
    clientId: string;
    discordId: string|null;
    displayName: string;
    createdAt: Date;
    nameChangeAvailableAt: Date;
    banned: boolean;
    bannedUntil: Date|null;
    muted: boolean;
    perks: AccountPerk[];
    settings: AccountSettings;
    gameOptions: AccountGameOptions;

    constructor(
        model: AccountInfoModel
    ) {
        this.clientId = model.client_id;
        this.discordId = model.discord_id;
        this.displayName = model.display_name;
        this.createdAt = new Date(model.created_at);
        this.nameChangeAvailableAt = new Date(model.name_change_available_at);
        this.banned = model.banned;
        this.bannedUntil = model.banned_until ? new Date(model.banned_until) : null;
        this.muted = model.muted;
        this.perks = model.perks;
        this.settings = model.settings;
        this.gameOptions = model.options;
    }
}