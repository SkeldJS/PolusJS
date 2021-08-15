import http from "http";

import { PolusGGClient } from "../../client";
import { HttpMethod, PolusRestClient, RequestOptions } from "./RestClient";

import { ApiEndpoints, Endpoint } from "../endpoints";
import { ApiError } from "../ApiError";
import { NonJsonResponse } from "../NonJsonResponse";

export class PolusCosmeticsRestClient extends PolusRestClient {
    baseUrl = "rose.hall.ly";//"cosmetics.service.polus.gg";

    constructor(
        protected readonly client: PolusGGClient
    ) {
        super(client);
    }

    makeAuthorisedRequest<ReqType, ResType>(
        method: HttpMethod,
        endpoint: Endpoint<ReqType, ResType>,
        options: Partial<RequestOptions<ReqType>> = {}
    ): Promise<ResType> {
        return new Promise((resolve, reject) => {
            const headers = {
                "Accept": "application/json",
                "Authorization": this.client.getAccessToken() + ":" + this.client.accountInfo?.clientId,
                ...options.headers
            } as any;

            const req = http.request({
                method,
                headers,
                port: options.port || 2219,
                host: options.baseUrl || this.baseUrl,
                path: "/v1" + endpoint
            }, function (res) {
                const isOk = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;

                const chunks: Buffer[] = [];
                res.on("data", chunk => {
                    chunks.push(chunk);
                });

                res.on("end", () => {
                    const full = Buffer.concat(chunks).toString("utf8");

                    try {
                        const json = JSON.parse(full);

                        if (isOk) {
                            resolve(json.data);
                        } else {
                            return reject(new ApiError(res.statusCode!, json.message));
                        }
                    } catch (e) {
                        if (isOk) {
                            return reject(new NonJsonResponse(full));
                        } else {
                            return reject(new ApiError(res.statusCode!));
                        }
                    }
                });
            });

            if (method !== "GET") {
                const body = typeof options.body === "object"
                    ? JSON.stringify(options.body)
                    : options.body;
    
                if (options.body) {
                    req.write(body);
                }
            }

            req.end();
        });
    }

    async getAllCosmetics() {
        return await this.makeAuthorisedRequest(
            "GET",
            ApiEndpoints.GetAllCosmetics()
        );
    }

    async getAllPurchases() {
        return await this.makeAuthorisedRequest(
            "GET",
            ApiEndpoints.GetAllPurchases()
        );
    }

    async getBundle(bundleId: string) {
        return await this.makeAuthorisedRequest(
            "GET",
            ApiEndpoints.GetBundle(bundleId)
        );
    }

    async getBundleList() {
        return await this.makeAuthorisedRequest(
            "GET",
            ApiEndpoints.GetBundleList()
        );
    }

    async getCosmetic(cosmeticId: string) {
        return await this.makeAuthorisedRequest(
            "GET",
            ApiEndpoints.GetCosmetic(cosmeticId)
        );
    }

    async getCosmeticItemByAuId(amongUsId: number) {
        return await this.makeAuthorisedRequest(
            "GET",
            ApiEndpoints.GetCosmeticByAuId(amongUsId)
        );
    }

    async getPurchase(purchaseId: string) {
        return await this.makeAuthorisedRequest(
            "GET",
            ApiEndpoints.GetPurchase(purchaseId)
        );
    }
}