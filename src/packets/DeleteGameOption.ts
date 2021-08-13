import * as protocol from "@skeldjs/protocol";
import { HazelReader, HazelWriter } from "@skeldjs/util";

export class DeleteGameOptionMessage extends protocol.BaseRootMessage {
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