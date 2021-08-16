import * as skeldjs from "@skeldjs/core";

import { BasicEvent } from "@skeldjs/events";

export class PlayerReviveEvent<RoomType extends skeldjs.Hostable> extends BasicEvent {
    static eventName = "player.revive" as const;
    eventName = "player.revive" as const;

    constructor(
        public readonly room: RoomType,
        public readonly player: skeldjs.PlayerData<RoomType>
    ) {
        super();
    }
}