import { CosmeticResourceIdentifierModel, CosmeticType } from "../rest";

export class PolusHat {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly author: string,
        public readonly amongUsId: number,
        public readonly resource: CosmeticResourceIdentifierModel,
        public readonly thumbnail: string,
        public readonly type: CosmeticType,
        public readonly color: string,
        public canBeUsed: boolean
    ) {}
}