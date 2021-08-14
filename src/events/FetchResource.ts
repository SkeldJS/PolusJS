import { BasicEvent } from "@skeldjs/events";
import { ResourceType } from "../packets";

export class FetchResourceEvent extends BasicEvent {
    static eventName = "polusgg.fetchresource" as const;
    eventName = "polusgg.fetchresource" as const;

    downloadedBuffer?: Buffer;
    downloadCached: boolean
    failCode?: number;

    constructor(
        public readonly resourceId: number,
        public readonly resourceLocation: string,
        public readonly resourceHash: Buffer,
        public readonly resourceType: ResourceType
    ) {
        super();

        this.downloadCached = false;
    }

    setDownloaded(buffer: Buffer, cached = false) {
        this.downloadedBuffer = buffer;
        this.downloadCached = cached;
    }

    setFailed(code: number) {
        this.failCode = code;
    }
}