import { BaseRpcMessage } from "@skeldjs/protocol";
import { PolusRpcTag } from "../enums";

export class ClickMessage extends BaseRpcMessage {
    static tag = PolusRpcTag.Click as const;
    tag = PolusRpcTag.Click as const;
}