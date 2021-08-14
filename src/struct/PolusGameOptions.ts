import { ReliablePacket, RpcMessage } from "@skeldjs/protocol";
import { PolusGGClient } from "../client";
import { PolusRootMessageTag } from "../enums";
import { DeleteGameOptionMessage, SetGameOptionMessage } from "../packets";
import { stripTMP } from "../util/stripTMP";

export interface PolusGameOptionsEnumValue {
    type: "ENUM";
    index: number;
    options: string[];
}

export interface PolusGameOptionsNumberValue {
    type: "NUMBER";
    step: number;
    lower: number;
    upper: number;
    value: number;
    suffix: string;
    zeroIsInfinity: boolean;
}

export interface PolusGameOptionsBooleanValue {
    type: "BOOLEAN",
    value: boolean;
}

export type PolusGameOptionsValue =
    PolusGameOptionsEnumValue |
    PolusGameOptionsNumberValue |
    PolusGameOptionsBooleanValue;

export interface PolusGameOptionsEntry {
    key: string;
    value: PolusGameOptionsValue;
    category: string;
    priority: number;
}

export interface AllPolusGameOptions {
    [key: string]: PolusGameOptionsEntry|PolusGameOptionsEntry[];
}

export class PolusGameOptions {
    fastStrippedToOption: Map<string, PolusGameOptionsEntry>;
    options: PolusGameOptionsEntry[];

    updateQueue: (SetGameOptionMessage|DeleteGameOptionMessage)[];
    seqId: number;

    constructor(
        public readonly client: PolusGGClient
    ) {
        this.fastStrippedToOption = new Map;
        this.options = [];

        this.updateQueue = [];
        this.seqId = 0;
    }

    nextSeqId() {
        this.seqId++;
        if (this.seqId >= 65535) {
            this.seqId = 0;
        }
        return this.seqId;
    }

    flushUpdateQueue() {
        for (const updateMessage of this.updateQueue) {
            if (updateMessage.tag === PolusRootMessageTag.SetGameOption) {
                this.addOptionEntry(updateMessage.optionEntry);
            } else if (updateMessage.tag === PolusRootMessageTag.DeleteGameOption) {
                this.removeOptionEntry(updateMessage.optionName);
            }
        }
        this.updateQueue = [];
    }

    addOptionEntry(entry: PolusGameOptionsEntry) {
        const cachedEntry = this.options.find(opt => opt.key === entry.key);

        if (cachedEntry) {
            cachedEntry.value = entry.value;
            return;
        }

        this.fastStrippedToOption.set(stripTMP(entry.key).trim(), entry);
        this.options.push(entry);
    }

    removeOptionEntry(optionName: string) {
        const optionIdx = this.options.findIndex(option => option.key === optionName);

        if (optionIdx !== -1) {
            this.options.splice(optionIdx, 1);
            this.fastStrippedToOption.delete(stripTMP(optionName).trim());
        }
    }

    async setOption(optionName: string, value: any, bypassRestriction = false) {
        const optionEntry = this.fastStrippedToOption.get(optionName);

        if (!optionEntry) {
            throw new SyntaxError("Option not found: " + optionName);
        }

        switch (optionEntry.value.type) {
            case "ENUM":
                const idx = optionEntry.value.options.indexOf(value)
                if (idx === -1 && !bypassRestriction) {
                    throw new SyntaxError("Value must be one of: " + optionEntry.value.options.join(", "));
                }
                optionEntry.value.index = idx;
                break;
            case "NUMBER":
                if (typeof value !== "number" && !bypassRestriction) {
                    throw new SyntaxError("Expected number, got " + typeof value);
                }
                if (value < optionEntry.value.lower && !bypassRestriction) {
                    throw new SyntaxError("Value must be higher than or equal to " + optionEntry.value.lower);
                }
                if (value > optionEntry.value.upper && !bypassRestriction) {
                    throw new SyntaxError("Value must be lower than or equal to " + optionEntry.value.upper);
                }
                if (value === Infinity && optionEntry.value.zeroIsInfinity) {
                    value = 0;
                }
                optionEntry.value.value = value;
                break;
            case "BOOLEAN":
                if (typeof value !== "boolean" && !bypassRestriction) {
                    throw new SyntaxError("Expected boolean, got " + typeof value);
                }
                optionEntry.value.value = false;
                break;
        }

        await this.client.skeldjsClient.send(
            new ReliablePacket(
                this.client.skeldjsClient.getNextNonce(),
                [
                    new SetGameOptionMessage(
                        this.seqId,
                        optionEntry
                    )
                ]
            )
        );

        this.nextSeqId();
    }

    getOption(optionName: string) {
        return this.fastStrippedToOption.get(optionName)?.value;
    }
}