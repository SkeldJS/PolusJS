import * as protocol from "@skeldjs/protocol";
import { HazelReader, HazelWriter } from "@skeldjs/util";

import { OptionType, PolusRootMessageTag } from "../enums";
import { PolusGameOptionsBooleanValue, PolusGameOptionsEntry, PolusGameOptionsEnumValue, PolusGameOptionsNumberValue, PolusGameOptionsValue } from "../struct";

export class SetGameOptionMessage extends protocol.BaseRootMessage {
    static tag = PolusRootMessageTag.SetGameOption as const;
    tag = PolusRootMessageTag.SetGameOption as const;

    constructor(
        public readonly seqId: number,
        public readonly optionEntry: PolusGameOptionsEntry
    ) {
        super();
    }

    static Deserialize(reader: HazelReader) {
        const seqId = reader.uint16();
        const category = reader.string();
        const priority = reader.uint16();
        const key = reader.string();
        const optionType = reader.uint8();

        const value: Partial<PolusGameOptionsValue> = {};

        switch (optionType) {
            case OptionType.Number:
                const numberValue = value as PolusGameOptionsNumberValue;
                numberValue.type = "NUMBER";
                numberValue.value = reader.float();
                numberValue.step = reader.float();
                numberValue.lower = reader.float();
                numberValue.upper = reader.float();
                numberValue.zeroIsInfinity = reader.bool();
                numberValue.suffix = reader.string();
                break;
            case OptionType.Boolean:
                const boolValue = value as PolusGameOptionsBooleanValue;
                boolValue.type = "BOOLEAN";
                boolValue.value = reader.bool();
                break;
            case OptionType.Enum:
                const enumValue = value as PolusGameOptionsEnumValue;
                enumValue.type = "ENUM";
                enumValue.index = reader.upacked();
                enumValue.options = [];
                while (reader.left) {
                    enumValue.options.push(reader.string());
                }
                break;
        }

        return new SetGameOptionMessage(seqId, {
            category,
            priority,
            key,
            value
        } as PolusGameOptionsEntry);
    }

    Serialize(writer: HazelWriter) {
        writer.uint16(this.seqId);
        writer.string(this.optionEntry.category);
        writer.uint16(this.optionEntry.priority);
        writer.string(this.optionEntry.key);

        switch (this.optionEntry.value.type) {
            case "NUMBER":
                writer.uint8(OptionType.Number);
                writer.float(this.optionEntry.value.value);
                writer.float(this.optionEntry.value.step);
                writer.float(this.optionEntry.value.lower);
                writer.float(this.optionEntry.value.upper);
                writer.bool(this.optionEntry.value.zeroIsInfinity);
                writer.string(this.optionEntry.value.suffix);
                break;
            case "BOOLEAN":
                writer.uint8(OptionType.Boolean);
                writer.bool(this.optionEntry.value.value);
                break;
            case "ENUM":
                writer.uint8(OptionType.Enum);
                writer.upacked(this.optionEntry.value.index);
                for (const option of this.optionEntry.value.options) {
                    writer.string(option);
                }
                break;
        }
    }
}