import * as skeldjs from "@skeldjs/client";
import { HazelReader, HazelWriter, Vector2 } from "@skeldjs/util";

export interface PolusCameraControllerData {
    camOffset: Vector2;
}

export class PolusCameraController<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    static classname = "PolusCameraController" as const;
    classname = "PolusCameraController" as const;

    camOffset: Vector2;

    constructor(
        room: RoomType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusCameraControllerData
    ) {
        super(room, netid, ownerid, flags, data);

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