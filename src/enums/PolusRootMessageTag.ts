export enum PolusRootMessageTag {
    FetchResource = 0x80,
    Resize,
    Intro,
    EndGame,
    SetString,
    DeclareHat,
    SetGameOption = 0x89,
    DeleteGameOption,
    SetHudVisibility = 0x8b,
    AllowTaskInteraction,
    LoadHat = 0x96,
    LoadPet,
    SetBody,
    LoadSkin,
    ChangeScene,
    MarkAssBrown,
    ModstampSetString,
    DisplaySystemAnnouncement = 0xfa,
    UpdateDiscordRichPresence = 0xfb
}