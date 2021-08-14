import * as skeldjs from "@skeldjs/client";
import { HazelReader, HazelWriter, Vector2 } from "@skeldjs/util";

export interface PolusNetworkTransformData {
    position: Vector2;
    layer: number;
}

export class PolusNetworkTransform<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    static classname = "PolusNetworkTransform" as const;
    classname = "PolusNetworkTransform" as const;

    position: Vector2;
    layer: number;

    constructor(
        room: RoomType,
        spawnType: skeldjs.SpawnType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusNetworkTransformData
    ) {
        super(room, spawnType, netid, ownerid, flags, data);

        this.position ||= Vector2.null;
        this.layer ||= 0;
    }

    Deserialize(reader: HazelReader, isSpawn: boolean) {
        const align = reader.uint8(); // maybe todo: button alignment

        this.position = reader.vector();
        this.layer = reader.float();

        if (align !== 0) {
            reader.upacked(); // something ??
        }
    }

    Serialize(writer: HazelWriter, isSpawn: boolean) {
        writer.uint8(0);
        writer.vector(this.position);
        writer.upacked(this.layer);
        writer.upacked(0);
        return true;
    }
}