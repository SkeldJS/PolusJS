import https from "https";

import { PolusGGClient } from "../../client";
import { ApiError } from "../ApiError";
import { DeclareEndpoint } from "../endpoints";
import { NonJsonResponse } from "../NonJsonResponse";

export type RequestOptions<ReqType> = {
    baseUrl: string;
    port: number;
    body: ReqType;
    headers: Record<string, string>;
};

export type HttpMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";

export class PolusRestClient {
    baseUrl!: string;

    constructor(
        protected readonly client: PolusGGClient
    ) {}

    makeAuthorisedRequest<ReqType, ResType>(
        method: HttpMethod,
        endpoint: DeclareEndpoint<ReqType, ResType>,
        options: Partial<RequestOptions<ReqType>> = {}
    ): Promise<ResType> {
        return new Promise((resolve, reject) => {
            const headers = {
                "Accept": "application/json",
                "Content-Type": "application/json",
                ...options.headers
            } as any;

            const req = https.request({
                method,
                headers,
                port: options.port,
                host: options.baseUrl || this.baseUrl,
                path: endpoint
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
}