import { BaseRpcMessage } from "@skeldjs/protocol";
import { PolusRpcTag } from "../enums";

export class ClickMessage extends BaseRpcMessage {
    static messageTag = PolusRpcTag.Click as const;
    messageTag = PolusRpcTag.Click as const;
}