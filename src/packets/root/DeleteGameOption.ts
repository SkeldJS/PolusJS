import * as protocol from "@skeldjs/protocol";
import { HazelReader, HazelWriter } from "@skeldjs/util";
import { PolusRootMessageTag } from "../../enums";

export class DeleteGameOptionMessage extends protocol.BaseRootMessage {
    static messageTag = PolusRootMessageTag.DeleteGameOption as const;
    messageTag = PolusRootMessageTag.DeleteGameOption as const;

    constructor(
        public readonly seqId: number,
        public readonly optionName: string
    ) {
        super();
    }

    static Deserialize(reader: HazelReader) {
        const seqId = reader.uint16();
        const optionName = reader.string();
        return new DeleteGameOptionMessage(seqId, optionName);
    }

    Serialize(writer: HazelWriter) {
        writer.uint16(this.seqId);
        writer.string(this.optionName);
    }
}