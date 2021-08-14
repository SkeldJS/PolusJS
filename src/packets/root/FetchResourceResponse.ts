import * as protocol from "@skeldjs/protocol";
import { HazelReader, HazelWriter } from "@skeldjs/util";
import { PolusRootMessageTag } from "../../enums";

export enum FetchResourceResponseType {
    DownloadStarted,
    DownloadEnded,
    DownloadFailed
}

export class FetchResourceResponseMessage extends protocol.BaseRootMessage {
    static messageTag = PolusRootMessageTag.FetchResource as const;
    messageTag = PolusRootMessageTag.FetchResource as const;

    constructor(
        resourceId: number,
        responseType: FetchResourceResponseType.DownloadFailed,
        failReason: number
    );
    constructor(
        resourceId: number,
        responseType: FetchResourceResponseType.DownloadEnded,
        wasCached: boolean
    );
    constructor(
        public readonly resourceId: number,
        public readonly responseType: FetchResourceResponseType,
        public readonly reason: number|boolean
    ) {
        super();
    }

    static Deserialize(reader: HazelReader) {
        const resourceId = reader.upacked();
        const responseType = reader.uint8();
        const failReason = reader.upacked();

        return new FetchResourceResponseMessage(resourceId, responseType, failReason);
    }

    Serialize(writer: HazelWriter) {
        writer.upacked(this.resourceId);
        writer.uint8(this.responseType);
        if (typeof this.reason === "boolean") {
            writer.bool(this.reason);
        } else {
            writer.upacked(this.reason);
        }
    }
}