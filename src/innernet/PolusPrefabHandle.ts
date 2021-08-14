import * as skeldjs from "@skeldjs/client";
import { HazelReader } from "@skeldjs/util";

export interface PolusPrefabHandleData {}

export class PolusPrefabHandle<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    static classname = "PolusPrefabHandle" as const;
    classname = "PolusPrefabHandle" as const;

    constructor(
        room: RoomType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusPrefabHandleData
    ) {
        super(room, netid, ownerid, flags, data);
    }
}