import * as skeldjs from "@skeldjs/client";
import { BasicEvent } from "@skeldjs/events";
import { VersionInfo } from "@skeldjs/util";
import { PolusGGClient } from "./client";

export class PolusSkeldjsClient extends skeldjs.SkeldjsClient {
    constructor(
        public readonly polusGGClient: PolusGGClient,
        public readonly clientVersion: string|number|VersionInfo,
        options: Partial<skeldjs.ClientConfig>
    ) {
        super(clientVersion, options);
    }

    protected _send(buffer: Buffer) {
        const signedBytes = this.polusGGClient.signingHelper.signBytes(buffer);

        return super._send(signedBytes);
    }


    async emit<Event extends BasicEvent>(event: Event): Promise<Event> {
        this.polusGGClient.emit(event);

        return super.emit(event);
    }
}