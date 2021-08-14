import * as skeldjs from "@skeldjs/client";
import { HazelReader } from "@skeldjs/util";

export interface PolusPoiData {}

export class PolusPoi<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    static classname = "PolusPoi" as const;
    classname = "PolusPoi" as const;

    constructor(
        room: RoomType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusPoiData
    ) {
        super(room, netid, ownerid, flags, data);
    }
}