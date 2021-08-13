import https from "https";
import { PolusGGClient } from "../client";

import { ApiError } from "./ApiError";
import { ApiEndpoints, DeclareEndpoint } from "./endpoints";
import { NonJsonResponse } from "./NonJsonResponse";

export type RequestOptions<ReqType> = {
    body: ReqType;
    headers: Record<string, string>;
};

export type HttpMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";

export class PGGRestClient {
    static BaseUrl = "account.polus.gg"

    constructor(
        protected readonly client: PolusGGClient
    ) {}

    makeAuthorisedRequest<ReqType, ResType>(
        method: HttpMethod,
        endpoint: DeclareEndpoint<ReqType, ResType>,
        options: Partial<RequestOptions<ReqType>>
    ): Promise<ResType> {
        return new Promise((resolve, reject) => {
            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                ...options.headers
            } as any;

            const accessToken = this.client.getAccessToken();
            if (accessToken) {
                headers.Authorization = "Bearer " + accessToken;
            }
            if (this.client.accountInfo?.clientId) {
                headers["Client-Id"] = this.client.accountInfo?.clientId;
            }

            const req = https.request({
                method,
                headers,
                host: PGGRestClient.BaseUrl,
                path: "/api/v1" + endpoint
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

    async loginWithEmail(email: string, password: string) {
        return await this.makeAuthorisedRequest(
            "POST",
            ApiEndpoints.AccountLogin(),
            {
                body: {
                    email,
                    password
                }
            }
        );
    }
}