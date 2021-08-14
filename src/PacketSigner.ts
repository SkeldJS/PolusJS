import crypto from "crypto";

import { PolusGGClient } from "./client";

export class PacketSigner {
    constructor(
        public readonly client: PolusGGClient
    ) {}

    signBytes(bytes: Buffer) {
        const accessToken = this.client.getAccessToken();

        if (!accessToken || !this.client.accountInfo) {
            throw new Error("Not signed in; cannot sign bytes.");
        }

        const hmacSigner = crypto.createHmac("SHA1", accessToken);
        const hash = hmacSigner.update(bytes).digest();
        hash[19] -= 2;

        const outputBytes = Buffer.alloc(
            + 1 /* auth byte */
            + 16 /* uuid size */
            + 20 /* hmac hash size */
            + bytes.byteLength
        );

        outputBytes[0] = 128; /* auth byte */
        const uuidBytes = Buffer.from(this.client.accountInfo.clientId.replace(/-/g, ""), "hex");
        uuidBytes.copy(outputBytes, 1);
        hash.copy(outputBytes, 17);
        bytes.copy(outputBytes, 37);

        return outputBytes;
    }
}