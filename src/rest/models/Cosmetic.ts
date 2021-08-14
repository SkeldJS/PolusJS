export type CosmeticType = "HAT" | "PET" | "SKIN";

export interface CosmeticResourceIdentifierModel {
    path: string;
    url: string;
    id: number;
}

export interface CosmeticModel {
    id: string;
    name: string;
    author: string;
    amongUsId: number;
    resource: CosmeticResourceIdentifierModel;
    thumbnail: string;
    type: CosmeticType;
    color: string;
}