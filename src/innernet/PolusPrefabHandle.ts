import * as skeldjs from "@skeldjs/client";
import { HazelReader } from "@skeldjs/util";

export interface PolusPrefabHandleData {}

export class PolusPrefabHandle<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    constructor(
        room: RoomType,
        spawnType: skeldjs.SpawnType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusPrefabHandleData
    ) {
        super(room, spawnType, netid, ownerid, flags, data);
    }
}