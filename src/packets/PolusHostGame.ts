import * as skeldjs from "@skeldjs/client";
import * as protocol from "@skeldjs/protocol";

import { RootMessageTag } from "@skeldjs/constant";
import { Code2Int, HazelReader, HazelWriter } from "@skeldjs/util";

export class PolusHostGameMessage extends protocol.BaseRootMessage {
    static tag = RootMessageTag.HostGame as const;
    tag = RootMessageTag.HostGame as const;

    readonly code!: number;
    readonly options!: protocol.GameSettings;
    readonly quickchat!: skeldjs.QuickChatMode;
    readonly migrated!: boolean;

    constructor(code: string | number);
    constructor(
        options: protocol.GameSettings,
        quickchat: skeldjs.QuickChatMode,
        migrated: boolean
    );
    constructor(
        options: protocol.GameSettings | string | number,
        quickchat?: skeldjs.QuickChatMode,
        migrated?: boolean
    ) {
        super();

        if (typeof options === "string") {
            this.code = Code2Int(options);
        } else if (typeof options === "number") {
            this.code = options;
        } else if (typeof quickchat === "number") {
            this.options = options;
            this.quickchat = quickchat;
            this.migrated = migrated!;
        }
    }

    static Deserialize(reader: HazelReader, direction: protocol.MessageDirection) {
        if (direction === protocol.MessageDirection.Clientbound) {
            const code = reader.int32();

            return new PolusHostGameMessage(code);
        } else {
            const gameOptions = protocol.GameSettings.Deserialize(reader);
            const quickChat = reader.uint8();
            const migrated = reader.bool();
    
            return new PolusHostGameMessage(gameOptions, quickChat, migrated);
        }
    }

    Serialize(writer: HazelWriter, direction: protocol.MessageDirection) {
        if (direction === protocol.MessageDirection.Clientbound) {
            writer.int32(this.code);
        } else {
            writer.write(this.options);
            writer.uint8(this.quickchat);
            writer.bool(this.migrated);
        }
    }
}