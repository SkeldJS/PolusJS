import * as protocol from "@skeldjs/protocol";
import { HazelReader, HazelWriter } from "@skeldjs/util";
import { PolusRootMessageTag } from "../enums";

export enum ResourceType {
    AssetBundle,
    Assembly,
    Asset
}

export class FetchResourceMessage extends protocol.BaseRootMessage {
    static tag = PolusRootMessageTag.FetchResource as const;
    tag = PolusRootMessageTag.FetchResource as const;
    constructor(
        public readonly resourceId: number,
        public readonly resourceLocation: string,
        public readonly resourceHash: Buffer,
        public readonly resourceType: ResourceType
    ) {
        super();
    }

    static Deserialize(reader: HazelReader) {
        const resourceId = reader.upacked();
        const resourceLocation = reader.string();
        const resourceHash = reader.bytes(32);
        const resourceType = reader.uint8();

        return new FetchResourceMessage(resourceId, resourceLocation, resourceHash.buffer, resourceType);
    }

    Serialize(writer: HazelWriter) {
        writer.upacked(this.resourceId);
        writer.string(this.resourceLocation);
        writer.bytes(this.resourceHash);
        writer.uint8(this.resourceType);
    }
}