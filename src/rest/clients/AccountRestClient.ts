import { PolusGGClient } from "../../client";
import { HttpMethod, PolusRestClient, RequestOptions } from "./RestClient";

import { ApiEndpoints, Endpoint } from "../endpoints";

export class PolusAccountRestClient extends PolusRestClient {
    baseUrl = "account.polus.gg";

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
        if (options.headers) {
            const accessToken = this.client.getAccessToken();
            if (accessToken) {
                options.headers.Authorization = "Bearer " + accessToken;
            }
            if (this.client.accountInfo?.clientId) {
                options.headers["Client-Id"] = this.client.accountInfo?.clientId;
            }
        }

        return super.makeAuthorisedRequest(method, ("/api/v1" + endpoint) as Endpoint<ReqType, ResType>, options);
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