import dgram from "dgram";

import * as skeldjs from "@skeldjs/client";
import * as protocol from "@skeldjs/protocol";
import { VersionInfo } from "@skeldjs/util";

import { PacketSigner } from "./PacketSigner";
import { AccountInfo } from "./struct/AccountInfo";
import { ClientConfig } from "@skeldjs/client/dist/lib/interface/ClientConfig";
import { PolusGameOptions, PolusCosmetic } from "./struct";
import { CustomNetworkTransform, PlayerPhysics, RoomID, SkeldjsClientEvents, SpawnType } from "@skeldjs/client";

import { EventEmitter, ExtractEventTypes } from "@skeldjs/events";
import { FetchResourceEvent, PlayerReviveEvent } from "./events";

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
    LoadPetMessage,
    LoadSkinMessage,
    PolusHostGameMessage,
    SetGameOptionMessage
} from "./packets";

import {
    PolusCameraController,
    PolusClickBehaviour,
    PolusDeadBody,
    PolusGraphic,
    PolusNetworkTransform,
    PolusPlayerControl,
    PolusPoi,
    PolusPrefabHandle,
    PolusSoundSource
} from "./innernet";
import { BuiltInHats, BuiltInPets, BuiltInSkins } from "./data";
import { PolusSpawnType } from "./enums";
import { PolusSkeldjsClient } from "./PolusSkeldjsClient";

export interface PolusGGCredentials {
    email: string;
    password: string;
}

export type PolusGGClientEvents<RoomType extends skeldjs.Hostable> = SkeldjsClientEvents & ExtractEventTypes<[
    FetchResourceEvent,
    PlayerReviveEvent<RoomType>
]>;

export class PolusGGClient extends EventEmitter<PolusGGClientEvents<PolusSkeldjsClient>> {
    skeldjsClient: PolusSkeldjsClient;
    gameOptions: PolusGameOptions;

    accountRestClient: PolusAccountRestClient;
    cosmeticsRestClient: PolusCosmeticsRestClient;
    signingHelper: PacketSigner;

    assetCache: Map<number, Buffer>;
    playerHats: Map<number, PolusCosmetic>;
    playerPets: Map<number, PolusCosmetic>;
    playerSkin: Map<number, PolusCosmetic>;

    accountInfo?: AccountInfo;

    getAccessToken: () => string|undefined;
    setAccessToken: (token: string) => void;

    constructor(clientVersion: string|number|VersionInfo, options: Partial<ClientConfig> = {}) {
        super();

        this.skeldjsClient = new PolusSkeldjsClient(this, clientVersion, { ...options, attemptAuth: false });
        this.gameOptions = new PolusGameOptions(this);

        this.accountRestClient = new PolusAccountRestClient(this);
        this.cosmeticsRestClient = new PolusCosmeticsRestClient(this);
        this.signingHelper = new PacketSigner(this);

        this.assetCache = new Map;
        this.playerHats = new Map;
        this.playerPets = new Map;
        this.playerSkin = new Map;

        this.skeldjsClient.options.attemptAuth = false;

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

        this.registerPrefabs();
        this.registerMessages();
        this.registerHandlers();
        this.initializeBuiltins();
    }

    registerPrefabs() {
        this.skeldjsClient.registerPrefab(SpawnType.Player, [ PolusPlayerControl, PlayerPhysics, CustomNetworkTransform ]);

        this.skeldjsClient.registerPrefab(PolusSpawnType.Image, [ PolusGraphic, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(PolusSpawnType.Button, [ PolusCameraController, PolusGraphic, PolusClickBehaviour ]);
        this.skeldjsClient.registerPrefab(PolusSpawnType.DeadBody, [ PolusDeadBody, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(PolusSpawnType.SoundSource, [ PolusSoundSource, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(PolusSpawnType.Poi, [ PolusPoi, PolusGraphic, PolusNetworkTransform ]);
        this.skeldjsClient.registerPrefab(PolusSpawnType.CameraController, [ PolusCameraController ]);
        this.skeldjsClient.registerPrefab(PolusSpawnType.PrefabHandler, [ PolusPrefabHandle, PolusNetworkTransform ]);
    }

    registerMessages() {
        this.skeldjsClient.decoder.register(
            ClickMessage,
            DeleteGameOptionMessage,
            FetchResourceMessage,
            FetchResourceResponseMessage,
            LoadHatMessage,
            LoadPetMessage,
            LoadSkinMessage,
            PolusHostGameMessage,
            SetGameOptionMessage
        );
    }

    registerHandlers() {
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
                                true
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
            const cachedCosmetic = this.playerHats.get(message.amongUsId);
            console.log("got laod hat like a boss", message);
            if (cachedCosmetic) {
                cachedCosmetic.canBeUsed = message.isFree;
            } else {
                const cosmeticInfo = await this.cosmeticsRestClient.getCosmeticItemByAuId(message.amongUsId);
                this.registerCosmetic(cosmeticInfo, false);
            }
        });

        this.skeldjsClient.decoder.on(LoadPetMessage, async message => {
            const cachedCosmetic = this.playerPets.get(message.amongUsId);
            if (cachedCosmetic) {
                cachedCosmetic.canBeUsed = message.isFree;
            } else {
                const cosmeticInfo = await this.cosmeticsRestClient.getCosmeticItemByAuId(message.amongUsId);
                this.registerCosmetic(cosmeticInfo, false);
            }
        });

        this.skeldjsClient.decoder.on(LoadSkinMessage, async message => {
            const cachedCosmetic = this.playerSkin.get(message.amongUsId);
            if (cachedCosmetic) {
                cachedCosmetic.canBeUsed = message.isFree;
            } else {
                const cosmeticInfo = await this.cosmeticsRestClient.getCosmeticItemByAuId(message.amongUsId);
                this.registerCosmetic(cosmeticInfo, false);
            }
        });
    }

    registerCosmetic(cosmetic: CosmeticModel, immediatelyUsable: boolean) {
        const polusCosmetic = new PolusCosmetic(
            cosmetic.id,
            cosmetic.name,
            cosmetic.author,
            cosmetic.amongUsId,
            cosmetic.resource,
            cosmetic.thumbnail,
            cosmetic.type,
            cosmetic.color,
            immediatelyUsable
        );

        switch (cosmetic.type) {
            case "HAT":
                this.playerHats.set(cosmetic.amongUsId, polusCosmetic);
                break;
            case "PET":
                this.playerPets.set(cosmetic.amongUsId, polusCosmetic);
                break;
            case "SKIN":
                this.playerSkin.set(cosmetic.amongUsId, polusCosmetic);
                break;
        }
    }

    initializeBuiltins() {
        for (const builtInHat of BuiltInHats) {
            this.registerCosmetic(builtInHat, true);
        }

        for (const builtInPet of BuiltInPets) {
            this.registerCosmetic(builtInPet, true);
        }

        for (const builtInSkin of BuiltInSkins) {
            this.registerCosmetic(builtInSkin, true);
        }
    }

    async login(email: string, password: string) {
        const { client_token, ...accountInfo } = await this.accountRestClient.loginWithEmail(email, password);

        this.setAccessToken(client_token);
        this.accountInfo = new AccountInfo(accountInfo as AccountInfoModel);

        const cosmeticItems = await this.cosmeticsRestClient.getAllCosmetics();
        for (const cosmeticItem of cosmeticItems) {
            this.registerCosmetic(cosmeticItem, false);
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

    async joinGame(code: RoomID) {
        return await this.skeldjsClient.joinGame(code);
    }

    private _setCosmetic(cosmetic: PolusCosmetic) {
        if (!cosmetic.canBeUsed)
            throw new Error("Tried to set cosmetic that you don't own.");

        const myControl = this.skeldjsClient.me?.control;

        if (!myControl) {
            throw new Error("Tried to set cosmetic while not spawned in.");
        }

        switch (cosmetic.type) {
            case "HAT":
                myControl.setHat(cosmetic.amongUsId);
                break;
            case "PET":
                myControl.setPet(cosmetic.amongUsId);
                break;
            case "SKIN":
                myControl.setSkin(cosmetic.amongUsId);
                break;
        }
    }

    getHatByName(hatName: string) {
        for (const [ , cosmetic ] of this.playerHats) {
            if (cosmetic.name.toLowerCase() === hatName.toLowerCase()) {
                return cosmetic;
            }
        }
        return undefined;
    }

    setHat(nameOrId: string|number) {
        if (typeof nameOrId === "string") {
            const hat = this.getHatByName(nameOrId);

            if (!hat) {
                throw new TypeError("Couldn't get cosmetic with name: " + nameOrId);
            }

            return this._setCosmetic(hat);
        }

        const hat = this.playerHats.get(nameOrId);

        if (!hat) {
            throw new TypeError("Couldn't get cosmetic with id: " + nameOrId);
        }

        return this._setCosmetic(hat);
    }

    getPetByName(petName: string) {
        for (const [ , cosmetic ] of this.playerPets) {
            if (cosmetic.name.toLowerCase() === petName.toLowerCase()) {
                return cosmetic;
            }
        }
        return undefined;
    }

    setPet(nameOrId: string|number) {
        if (typeof nameOrId === "string") {
            const pet = this.getPetByName(nameOrId);

            if (!pet) {
                throw new TypeError("Couldn't get cosmetic with name: " + nameOrId);
            }

            return this._setCosmetic(pet);
        }

        const pet = this.playerPets.get(nameOrId);

        if (!pet) {
            throw new TypeError("Couldn't get cosmetic with id: " + nameOrId);
        }

        return this._setCosmetic(pet);
    }

    getSkinByName(skinName: string) {
        for (const [ , cosmetic ] of this.playerSkin) {
            if (cosmetic.name.toLowerCase() === skinName.toLowerCase()) {
                return cosmetic;
            }
        }
        return undefined;
    }

    setSkin(nameOrId: string|number) {
        if (typeof nameOrId === "string") {
            const skin = this.getSkinByName(nameOrId);

            if (!skin) {
                throw new TypeError("Couldn't get cosmetic with name: " + nameOrId);
            }

            return this._setCosmetic(skin);
        }

        const skin = this.playerSkin.get(nameOrId);

        if (!skin) {
            throw new TypeError("Couldn't get cosmetic with id: " + nameOrId);
        }

        return this._setCosmetic(skin);
    }
}