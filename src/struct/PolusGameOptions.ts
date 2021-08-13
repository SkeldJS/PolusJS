import { HazelReader } from "@skeldjs/util";
import { OptionType } from "../enums";
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

    constructor() {
        this.fastStrippedToOption = new Map;
        this.options = [];
    }

    addOptionEntry(entry: PolusGameOptionsEntry) {
        console.log(entry);
        this.fastStrippedToOption.set(stripTMP(entry.key), entry);
        this.options.push(entry);
    }

    removeOptionEntry(optionName: string) {
        const optionIdx = this.options.findIndex(option => stripTMP(option.key) === optionName);

        if (optionIdx !== -1) {
            this.options.splice(optionIdx, 1);
        }
    }

    setOption(optionName: string, value: any, bypassRestriction = false) {
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
    }
}