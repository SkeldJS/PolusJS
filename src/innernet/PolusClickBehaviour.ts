import * as skeldjs from "@skeldjs/client";
import { HazelReader, HazelWriter } from "@skeldjs/util";

type RGBA = [ number, number, number, number ];

export interface PolusClickBehaviourData {
    maxTimer: number;
    currentTimer: number;
    isCountingDown: boolean;
    saturated: boolean;
    color: RGBA;
}

export class PolusClickBehaviour<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    static classname = "PolusClickBehaviour" as const;
    classname = "PolusClickBehaviour" as const;

    maxTimer: number;
    currentTimer: number;
    isCountingDown: boolean;
    saturated: boolean;
    color: RGBA;

    constructor(
        room: RoomType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusClickBehaviourData
    ) {
        super(room, netid, ownerid, flags, data);

        this.maxTimer ||= 0;
        this.currentTimer ||= 0;
        this.isCountingDown ||= false;
        this.saturated ||= false;
        this.color ||= [ 0, 0, 0, 0 ];
    }

    Deserialize(reader: HazelReader, isSpawn: boolean) {
        this.maxTimer = reader.float();
        this.currentTimer = reader.float();
        this.isCountingDown = reader.bool();
        this.saturated = reader.bool();
        this.color = [ reader.uint8(), reader.uint8(), reader.uint8(), reader.uint8() ];
    }

    Serialize(writer: HazelWriter, isSpawn: boolean) {
        writer.float(this.maxTimer);
        writer.float(this.currentTimer);
        writer.bool(this.isCountingDown);
        writer.bool(this.saturated);
        writer.uint8(this.color[0]);
        writer.uint8(this.color[1]);
        writer.uint8(this.color[2]);
        writer.uint8(this.color[3]);
        return true;
    }
}