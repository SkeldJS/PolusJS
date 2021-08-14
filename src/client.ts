import dgram from "dgram";

import * as skeldjs from "@skeldjs/client";
import * as protocol from "@skeldjs/protocol";
import { VersionInfo } from "@skeldjs/util";

import { PacketSigner } from "./PacketSigner";
import { AccountInfoModel, PGGRestClient } from "./rest";
import { AccountInfo } from "./struct/AccountInfo";
import { ClientConfig } from "@skeldjs/client/dist/lib/interface/ClientConfig";
import { DeleteGameOptionMessage, FetchResourceMessage, FetchResourceResponseMessage, FetchResourceResponseType, PolusHostGameMessage, SetGameOptionMessage } from "./packets";
import { PolusGameOptions } from "./struct";
import { RoomID } from "@skeldjs/client";
import { PolusCameraController, PolusClickBehaviour, PolusGraphic } from "./innernet";
import { EventEmitter, ExtractEventTypes } from "@skeldjs/events";
import { FetchResourceEvent } from "./events";

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

    rest: PGGRestClient;
    signer: PacketSigner;

    assetCache: Map<number, Buffer>;
    accountInfo?: AccountInfo;

    getAccessToken: () => string|undefined;
    setAccessToken: (token: string) => void;

    constructor(clientVersion: string|number|VersionInfo, options: Partial<ClientConfig> = {}) {
        this.skeldjsClient = new skeldjs.SkeldjsClient(clientVersion, { ...options, attemptAuth: false });
        this.gameOptions = new PolusGameOptions;

        this.rest = new PGGRestClient(this);
        this.signer = new PacketSigner(this);

        this.assetCache = new Map;
        this.skeldjsClient.options.attemptAuth = false;

        const originalSend = skeldjs.SkeldjsClient.prototype["_send"].bind(this.skeldjsClient);
        this.skeldjsClient["_send"] = (buffer: Buffer) => {
            const signed = this.signer.signBytes(buffer);
            originalSend(signed);
        }

        this.skeldjsClient.decoder.register(
            FetchResourceMessage,
            SetGameOptionMessage,
            DeleteGameOptionMessage,
            PolusHostGameMessage
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
                this.gameOptions.flushQueue();
                this.gameOptions.addOptionEntry(message.optionEntry);
                this.gameOptions.nextSeqId();
            } else {
                this.gameOptions.updateQueue.push(message);
            }
        });

        this.skeldjsClient.decoder.on(DeleteGameOptionMessage, async message => {
            if (message.seqId === this.gameOptions.seqId) {
                this.gameOptions.flushQueue();
                this.gameOptions.removeOptionEntry(message.optionName);
                this.gameOptions.nextSeqId();
            } else {
                this.gameOptions.updateQueue.push(message);
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
            if (this.skeldjsClient.connected) {
                this.skeldjsClient.send(
                    new protocol.PingPacket(
                        this.skeldjsClient.getNextNonce()
                    )
                );
            }
        }, 5000);
    }

    async login(email: string, password: string) {
        const { client_token, ...accountInfo } = await this.rest.loginWithEmail(email, password);

        this.setAccessToken(client_token);
        this.accountInfo = new AccountInfo(accountInfo as AccountInfoModel);

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

        switch (message.tag) {
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
}