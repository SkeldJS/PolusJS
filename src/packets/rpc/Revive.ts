import { BaseRpcMessage } from "@skeldjs/protocol";
import { PolusRpcTag } from "../../enums";

export class ReviveMessage extends BaseRpcMessage {
    static messageTag = PolusRpcTag.Revive as const;
    messageTag = PolusRpcTag.Revive as const;
}