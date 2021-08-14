import * as skeldjs from "@skeldjs/client";
import { HazelReader, HazelWriter } from "@skeldjs/util";
import { SoundType } from "../enums";

export interface PolusSoundSourceData {
    resourceId: number;
    pitch: number;
    volume: number;
    soundType: SoundType;
    loop: boolean;
    time: number;
}

export class PolusSoundSource<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    resourceId: number;
    pitch: number;
    volume: number;
    soundType: SoundType;
    loop: boolean;
    time: number;

    constructor(
        room: RoomType,
        spawnType: skeldjs.SpawnType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusSoundSourceData
    ) {
        super(room, spawnType, netid, ownerid, flags, data);

        this.resourceId ||= 0;
        this.pitch ||= 0;
        this.volume ||= 0;
        this.soundType ||= SoundType.None;
        this.loop ||= false;
        this.time ||= 0;
    }

    Deserialize(reader: HazelReader, isSpawn: boolean) {
        this.resourceId = reader.upacked();
        this.pitch = reader.float();
        this.volume = reader.float();
        this.loop = reader.bool();
        this.volume *= reader.uint8();
        this.time = reader.float();
    }

    Serialize(writer: HazelWriter, isSpawn: boolean) {
        writer.upacked(this.resourceId);
        writer.float(this.pitch);
        writer.float(this.volume);
        writer.bool(this.loop);
        writer.uint8(this.volume);
        writer.float(this.time);
        return true;
    }
}