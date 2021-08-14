import dgram from "dgram";

import * as skeldjs from "@skeldjs/client";
import * as protocol from "@skeldjs/protocol";
import { VersionInfo } from "@skeldjs/util";

import { PacketSigner } from "./PacketSigner";
import { AccountInfo } from "./struct/AccountInfo";
import { ClientConfig } from "@skeldjs/client/dist/lib/interface/ClientConfig";
import { PolusGameOptions, PolusHat } from "./struct";
import { RoomID } from "@skeldjs/client";

import { EventEmitter, ExtractEventTypes } from "@skeldjs/events";
import { FetchResourceEvent } from "./events";

import {
    AccountInfoModel,
    CosmeticModel,
    CosmeticType,
    PolusAccountRestClient,
    PolusCosmeticsRestClient
} from "./rest";

import {
    ClickMessage,
    DeleteGameOptionMessage,
    FetchResourceMessage,
    FetchResourceResponseMessage,
    FetchResourceResponseType,
    LoadHatMessage,
    PolusHostGameMessage,
    SetGameOptionMessage
} from "./packets";

import {
    PolusCameraController,
    PolusClickBehaviour,
    PolusDeadBody,
    PolusGraphic,
    PolusNetworkTransform,
    PolusPoi,
    PolusPrefabHandle,
    PolusSoundSource
} from "./innernet";
import { BuiltInHats } from "./data";

export interface PolusGGCredentials {
    email: string;
    password: string;
}

export type PolusGGClientEvents = ExtractEventTypes<[
    FetchResourceEvent
]>;

export class PolusGGClient extends EventEmitter<PolusGGClientEvents> {
    skeldjsClient: skeldjs.SkeldjsClient;
    gameOptions: PolusGameOptions;

    accountRestClient: PolusAccountRestClient;
    cosmeticsRestClient: PolusCosmeticsRestClient;
    signer: PacketSigner;

    assetCache: Map<number, Buffer>;
    playerHats: Map<number, PolusHat>;

    accountInfo?: AccountInfo;

    getAccessToken: () => string|undefined;
    setAccessToken: (token: string) => void;

    constructor(clientVersion: string|number|VersionInfo, options: Partial<ClientConfig> = {}) {
        super();

        this.skeldjsClient = new skeldjs.SkeldjsClient(clientVersion, { ...options, attemptAuth: false });
        this.gameOptions = new PolusGameOptions(this);

        this.accountRestClient = new PolusAccountRestClient(this);
        this.cosmeticsRestClient = new PolusCosmeticsRestClient(this);
        this.signer = new PacketSigner(this);

        this.assetCache = new Map;
        this.playerHats = new Map;
        this.skeldjsClient.options.attemptAuth = false;

        const originalSend = skeldjs.SkeldjsClient.prototype["_send"].bind(this.skeldjsClient);
        this.skeldjsClient["_send"] = (buffer: Buffer) => {
            const signed = this.signer.signBytes(buffer);
            originalSend(signed);
        }

        this.skeldjsClient.registerPrefab(128, [ PolusGraphic, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(129, [ PolusCameraController, PolusGraphic, PolusClickBehaviour ]);
        this.skeldjsClient.registerPrefab(131, [ PolusDeadBody, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(133, [ PolusSoundSource, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(135, [ PolusPoi, PolusGraphic, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(136, [ PolusCameraController ]);
        this.skeldjsClient.registerPrefab(137, [ PolusPrefabHandle, PolusNetworkTransform ]);

        this.skeldjsClient.decoder.register(
            ClickMessage,
            DeleteGameOptionMessage,
            FetchResourceMessage,
            FetchResourceResponseMessage,
            LoadHatMessage,
            PolusHostGameMessage,
            SetGameOptionMessage
        );

        this.skeldjsClient.decoder.on(FetchResourceMessage, async message => {
            const ev = await this.emit(
                new FetchResourceEvent(
                    message.resourceId,
                    message.resourceLocation,
                    message.resourceHash,
                    message.resourceType
                )
            );

            if (!ev.failCode && ev.downloadedBuffer) {
                this.assetCache.set(message.resourceId, ev.downloadedBuffer);
            }

            if (ev.failCode) {
                await this.skeldjsClient.send(
                    new protocol.ReliablePacket(
                        this.skeldjsClient.getNextNonce(),
                        [
                            new FetchResourceResponseMessage(
                                message.resourceId,
                                FetchResourceResponseType.DownloadFailed,
                                ev.failCode
                            )
                        ]
                    )
                );
            } else {
                await this.skeldjsClient.send(
                    new protocol.ReliablePacket(
                        this.skeldjsClient.getNextNonce(),
                        [
                            new FetchResourceResponseMessage(
                                message.resourceId,
                                FetchResourceResponseType.DownloadEnded,
                                ev.downloadCached
                            )
                        ]
                    )
                );
            }
        });

        this.skeldjsClient.decoder.on(SetGameOptionMessage, message => {
            if (message.seqId === this.gameOptions.seqId) {
                this.gameOptions.flushUpdateQueue();
                this.gameOptions.addOptionEntry(message.optionEntry);
                this.gameOptions.nextSeqId();
            } else {
                this.gameOptions.updateQueue.push(message);
            }
        });

        this.skeldjsClient.decoder.on(DeleteGameOptionMessage, async message => {
            if (message.seqId === this.gameOptions.seqId) {
                this.gameOptions.flushUpdateQueue();
                this.gameOptions.removeOptionEntry(message.optionName);
                this.gameOptions.nextSeqId();
            } else {
                this.gameOptions.updateQueue.push(message);
            }
        });

        this.skeldjsClient.decoder.on(LoadHatMessage, async message => {
            const cachedHat = this.playerHats.get(message.hatId);
            if (cachedHat) {
                if (message.isFree) {
                    cachedHat.canBeUsed = true;
                }
            } else {
                const cosmeticInfo = await this.cosmeticsRestClient.getCosmeticItemByAuId(message.hatId);
                this.registerHat(cosmeticInfo, false);
            }
        });

        let _secureToken = "";
        this.getAccessToken = function () {
            return _secureToken;
        }
        this.setAccessToken = function (token: string) {
            _secureToken = token;
        }

        setInterval(() => {
            // fix: client sends pings after server disconnects me
            if (this.skeldjsClient.connected) {
                this.skeldjsClient.send(
                    new protocol.PingPacket(
                        this.skeldjsClient.getNextNonce()
                    )
                );
            }
        }, 5000);

        this.initializeBuiltins();
    }

    registerHat(cosmetic: CosmeticModel, immediatelyUsable: boolean) {
        if (cosmetic.type !== "HAT") {
            throw new TypeError("Cosmetic was not of type 'HAT'");
        }

        this.playerHats.set(
            cosmetic.amongUsId,
            new PolusHat(
                cosmetic.id,
                cosmetic.name,
                cosmetic.author,
                cosmetic.amongUsId,
                cosmetic.resource,
                cosmetic.thumbnail,
                cosmetic.type,
                cosmetic.color,
                immediatelyUsable
            )
        );
    }

    initializeBuiltins() {
        for (const builtInHat of BuiltInHats) {
            this.registerHat(builtInHat, true);
        }
    }

    async login(email: string, password: string) {
        const { client_token, ...accountInfo } = await this.accountRestClient.loginWithEmail(email, password);

        this.setAccessToken(client_token);
        this.accountInfo = new AccountInfo(accountInfo as AccountInfoModel);

        const cosmeticItems = await this.cosmeticsRestClient.getCosmeticList();
        for (const cosmeticItem of cosmeticItems) {
            if (cosmeticItem.type === "HAT") {
                this.registerHat(cosmeticItem, false);
            }
        }

        return this.accountInfo;
    }

    async connect(host: string, port: number) {
        if (!this.accountInfo) {
            throw new Error("Not logged in; refusing to connect to polus.gg servers. Use .login(email, password)");
        }

        this.skeldjsClient.ip = host;
        this.skeldjsClient.port = port;
        this.skeldjsClient.socket = dgram.createSocket("udp4");

        this.skeldjsClient.socket.on("message", this.skeldjsClient.handleInboundMessage.bind(this.skeldjsClient));

        const nonce = this.skeldjsClient.getNextNonce();
        await this.skeldjsClient.send(
            new protocol.HelloPacket(
                nonce,
                this.skeldjsClient.version,
                this.accountInfo.displayName,
                0,
                this.skeldjsClient.options.language,
                this.skeldjsClient.options.chatMode
            )
        );

        await this.skeldjsClient.decoder.waitf(protocol.AcknowledgePacket, ack => ack.nonce === nonce);

        this.skeldjsClient.identified = true;
        this.skeldjsClient.connected = true;
        this.skeldjsClient.username = this.accountInfo.displayName;
        this.skeldjsClient.token = 0;
    }

    async hostGame(doJoin = true): Promise<RoomID> {
        const settings = new protocol.GameSettings({
            version: 2,
        });

        await this.skeldjsClient.send(
            new protocol.ReliablePacket(this.skeldjsClient.getNextNonce(), [
                new PolusHostGameMessage(settings, skeldjs.QuickChatMode.FreeChat, false),
            ])
        );

        const { message } = await Promise.race([
            this.skeldjsClient.decoder.waitf(
                protocol.JoinGameMessage,
                message => message.error !== undefined
            ),
            this.skeldjsClient.decoder.wait(protocol.RedirectMessage),
            this.skeldjsClient.decoder.wait(protocol.HostGameMessage),
        ]);

        switch (message.messageTag) {
            case skeldjs.RootMessageTag.JoinGame:
                throw new skeldjs.JoinError(message.error, skeldjs.DisconnectMessages[message.error || skeldjs.DisconnectReason.None] || message.message);
            case skeldjs.RootMessageTag.Redirect:
                await this.skeldjsClient.disconnect();
                await this.connect(this.skeldjsClient.ip!, this.skeldjsClient.port!);

                return await this.hostGame(doJoin);
            case skeldjs.RootMessageTag.HostGame:
                if (doJoin) {
                    this.skeldjsClient.joinGame(message.code);
                    return message.code;
                } else {
                    return message.code;
                }
        }
    }

    getHatByName(hatName: string) {
        for (const [ hatId, hat ] of this.playerHats) {
            if (hat.name === hatName)
                return hat;
        }

        return undefined;
    }

    private _setHat(hat: PolusHat) {
        if (!hat.canBeUsed)
            throw new Error("Tried to set hat that you don't own.");

        const myControl = this.skeldjsClient.me?.control;

        if (!myControl) {
            throw new Error("Tried to set hat while not spawned in.");
        }

        myControl.setHat(hat.amongUsId);
    }

    setHat(hatId: string|number) {
        if (typeof hatId === "string") {
            const hat = this.getHatByName(hatId);

            if (!hat) {
                throw new TypeError("Couldn't find hat with name: " + hatId);
            }

            return this._setHat(hat);
        }

        const hat = this.playerHats.get(hatId);

        if (!hat) {
            throw new TypeError("Couldn't get hat with id: " + hatId);
        }

        return this._setHat(hat);
    }
}