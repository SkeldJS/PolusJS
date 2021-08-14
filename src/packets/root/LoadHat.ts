import { BaseRootMessage } from "@skeldjs/protocol";
import { HazelReader, HazelWriter, Vector2 } from "@skeldjs/util";
import { PolusRootMessageTag } from "../../enums";

export class LoadHatMessage extends BaseRootMessage {
    static messageTag = PolusRootMessageTag.DeclareHat as const;
    messageTag = PolusRootMessageTag.DeclareHat as const;

    constructor(
        public readonly hatId: number,
        public readonly resourceId: number,
        public readonly isFree: boolean
    ) {
        super();
    }

    static Deserialize(reader: HazelReader) {
        const hatId = reader.upacked();
        const resourceId = reader.upacked();
        const isFree = reader.bool();

        return new LoadHatMessage(hatId, resourceId, isFree);
    }

    Serialize(writer: HazelWriter) {
        writer.upacked(this.hatId);
        writer.upacked(this.resourceId);
        writer.bool(this.isFree);
    }
}