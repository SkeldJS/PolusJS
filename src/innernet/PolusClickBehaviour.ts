import * as skeldjs from "@skeldjs/client";
import * as protocol from "@skeldjs/protocol";
import { HazelReader, HazelWriter } from "@skeldjs/util";
import { ClickMessage } from "../packets";

type RGBA = [ number, number, number, number ];

export interface PolusClickBehaviourData {
    maxTimer: number;
    currentTimer: number;
    isCountingDown: boolean;
    saturated: boolean;
    color: RGBA;
}

export class PolusClickBehaviour<RoomType extends skeldjs.Hostable> extends skeldjs.Networkable {
    maxTimer: number;
    currentTimer: number;
    isCountingDown: boolean;
    saturated: boolean;
    color: RGBA;

    constructor(
        room: RoomType,
        spawnType: skeldjs.SpawnType,
        netid: number,
        ownerid: number,
        flags: number,
        data?: HazelReader | PolusClickBehaviourData
    ) {
        super(room, spawnType, netid, ownerid, flags, data);

        this.maxTimer ||= 0;
        this.currentTimer ||= 0;
        this.isCountingDown ||= false;
        this.saturated ||= false;
        this.color ||= [ 0, 0, 0, 0 ];
    }

    FixedUpdate(delta: number) {
        if (this.isCountingDown) {
            this.currentTimer -= delta;

            if (this.currentTimer < 0)
                this.currentTimer = 0;
        }
    }

    Deserialize(reader: HazelReader, isSpawn: boolean) {
        this.maxTimer = reader.float();
        this.currentTimer = reader.float();
        this.isCountingDown = reader.bool();
        this.saturated = reader.bool();
        this.color = [ reader.uint8(), reader.uint8(), reader.uint8(), reader.uint8() ];
    }

    Serialize(writer: HazelWriter, isSpawn: boolean) {
        writer.float(this.maxTimer);
        writer.float(this.currentTimer);
        writer.bool(this.isCountingDown);
        writer.bool(this.saturated);
        writer.uint8(this.color[0]);
        writer.uint8(this.color[1]);
        writer.uint8(this.color[2]);
        writer.uint8(this.color[3]);
        return true;
    }

    click() {
        this.room.stream.push(
            new protocol.RpcMessage(
                this.netid,
                new ClickMessage
            )
        );
    }
}