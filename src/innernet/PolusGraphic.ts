import * as skeldjs from "@skeldjs/client";
import { HazelReader, HazelWriter } from "@skeldjs/util";

export interface PolusGraphicData {
    resourceId: number;
}

export class PolusGraphic<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    resourceId: number;

    constructor(
        room: RoomType,
        netid: number,
        spawnType: skeldjs.SpawnType,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusGraphicData
    ) {
        super(room, spawnType, netid, ownerid, flags, data);

        this.resourceId ||= 0;
    }

    Deserialize(reader: HazelReader, isSpawn: boolean) {
        this.resourceId = reader.upacked();
    }

    Serialize(writer: HazelWriter, isSpawn: boolean) {
        writer.upacked(this.resourceId);
        return true;
    }
}