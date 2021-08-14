import * as skeldjs from "@skeldjs/client";
import { HazelReader, HazelWriter, Vector2 } from "@skeldjs/util";

export interface PolusCameraControllerData {
    camOffset: Vector2;
}

export class PolusCameraController<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    camOffset: Vector2;

    constructor(
        room: RoomType,
        spawnType: skeldjs.SpawnType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusCameraControllerData
    ) {
        super(room, spawnType, netid, ownerid, flags, data);

        this.camOffset ||= Vector2.null;
    }

    Deserialize(reader: HazelReader, isSpawn: boolean) {
        this.camOffset = reader.vector();
    }

    Serialize(writer: HazelWriter, isSpawn: boolean) {
        writer.vector(this.camOffset);
        return true;
    }
}