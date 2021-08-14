import * as skeldjs from "@skeldjs/client";
import { HazelReader } from "@skeldjs/util";

export interface PolusPoiData {}

export class PolusPoi<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    constructor(
        room: RoomType,
        spawnType: skeldjs.SpawnType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusPoiData
    ) {
        super(room, spawnType, netid, ownerid, flags, data);
    }
}