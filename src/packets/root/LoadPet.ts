import { BaseRootMessage } from "@skeldjs/protocol";
import { HazelReader, HazelWriter } from "@skeldjs/util";
import { PolusRootMessageTag } from "../../enums";

export class LoadPetMessage extends BaseRootMessage {
    static messageTag = PolusRootMessageTag.LoadPet as const;
    messageTag = PolusRootMessageTag.LoadPet as const;

    constructor(
        public readonly amongUsId: number,
        public readonly resourceId: number,
        public readonly isFree: boolean
    ) {
        super();
    }

    static Deserialize(reader: HazelReader) {
        const petId = reader.upacked();
        const resourceId = reader.upacked();
        const isFree = reader.bool();

        return new LoadPetMessage(petId, resourceId, isFree);
    }

    Serialize(writer: HazelWriter) {
        writer.upacked(this.amongUsId);
        writer.upacked(this.resourceId);
        writer.bool(this.isFree);
    }
}