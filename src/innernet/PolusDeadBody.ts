import * as skeldjs from "@skeldjs/client";
import { HazelReader, HazelWriter } from "@skeldjs/util";

type RGBA = [ number, number, number, number ];

export interface PolusDeadBodyData {
    normalizedTime: number;
    flipX: boolean;
    parentId: number;
    mainColor: RGBA;
    secondColor: RGBA;
}

export class PolusDeadBody<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    static classname = "PolusDeadBody" as const;
    classname = "PolusDeadBody" as const;

    normalizedTime: number;
    flipX: boolean;
    parentId: number;
    mainColor: RGBA;
    secondColor: RGBA;

    constructor(
        room: RoomType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusDeadBodyData
    ) {
        super(room, netid, ownerid, flags, data);

        this.normalizedTime ||= 0;
        this.flipX ||= false;
        this.parentId ||= 0;
        this.mainColor ||= [ 0, 0, 0, 0 ];
        this.secondColor ||= [ 0, 0, 0, 0 ];
    }

    Deserialize(reader: HazelReader, isSpawn: boolean) {
        this.normalizedTime = reader.bool() ? 1 : 0;
        this.flipX = reader.bool();
        this.parentId = reader.uint8();
        this.mainColor = [ reader.uint8(), reader.uint8(), reader.uint8(), reader.uint8() ];
        this.secondColor = [ reader.uint8(), reader.uint8(), reader.uint8(), reader.uint8() ];
    }

    Serialize(writer: HazelWriter, isSpawn: boolean) {
        writer.bool(this.normalizedTime > 0);
        writer.bool(this.flipX);
        writer.uint8(this.parentId);
        writer.uint8(this.mainColor[0]);
        writer.uint8(this.mainColor[1]);
        writer.uint8(this.mainColor[2]);
        writer.uint8(this.mainColor[3]);
        writer.uint8(this.secondColor[0]);
        writer.uint8(this.secondColor[1]);
        writer.uint8(this.secondColor[2]);
        writer.uint8(this.secondColor[3]);
        return true;
    }
}