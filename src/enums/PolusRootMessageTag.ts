export enum PolusRootMessageTag {
    FetchResource = 0x80,
    Resize,
    DisplayStartGameScreen,
    OverwriteGameOver,
    SetString,
    DeclareHat,
    DeclarePet,
    DeclareSkin,
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
    DisplaySystemAlert = 0xfa,
    UpdateDiscordRichPresence = 0xfb
}