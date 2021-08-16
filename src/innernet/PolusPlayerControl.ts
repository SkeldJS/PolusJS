import * as skeldjs from "@skeldjs/client";
import * as protocol from "@skeldjs/protocol";
import { PolusRpcTag } from "../enums";
import { PlayerReviveEvent } from "../events";
import { ReviveMessage } from "../packets";

export class PolusPlayerControl<RoomType extends skeldjs.Hostable> extends skeldjs.PlayerControl<RoomType> {
    async HandleRpc(rpc: protocol.BaseRpcMessage) {
        switch (rpc.messageTag) {
            case PolusRpcTag.SetRole:
                break;
            case PolusRpcTag.Revive:
                this._handleReviveMessage(rpc);
                break;
            case PolusRpcTag.SetHat:
                break;
            case PolusRpcTag.SetOutline:
                break;
            case PolusRpcTag.SetAliveState:
                break;
            case PolusRpcTag.DisplayKillAnimation:
                break;
            case PolusRpcTag.SetSpeedModifier:
                break;
            case PolusRpcTag.SetVisionModifier:
                break;
            case PolusRpcTag.SetRemainingEmergencies:
                break;
            default:
                return super.HandleRpc(rpc);
        }
    }

    private async _handleReviveMessage(rpc: ReviveMessage) {
        await this._revive();

        this.emit(
            new PlayerReviveEvent(
                this.room,
                this.player
            )
        );
    }

    private async _revive() {
        const playerInfo = await this.room.gamedata?.getOrCreate(this.playerId);

        if (!playerInfo)
            return;

        playerInfo.setDead(false);
    }

    private _rpcRevive() {
        this.room.stream.push(
            new protocol.RpcMessage(
                this.netid,
                new ReviveMessage
            )
        );
    }

    async revive() {
        await this._revive();
        this._rpcRevive();

        this.emit(
            new PlayerReviveEvent(
                this.room,
                this.player
            )
        );
    }
}