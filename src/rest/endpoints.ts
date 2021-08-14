import { AccountLoginRequest } from "./requests";

import {
    AccountLoginResponse,
    CheckTokenResponse,
    CosmeticItemsResponse,
    CosmeticItemResponse
} from "./responses";

export type DeclareEndpoint<
    JSONParams extends Record<string, any> = {},
    ResponseType extends Record<string, any> = {}
> = string & { req: JSONParams } & { res: ResponseType };

export const ApiEndpoints = {
    AccountLogin:       () => "/auth/token" as DeclareEndpoint<AccountLoginRequest, AccountLoginResponse>,
    CheckToken:         () => "/auth/check" as DeclareEndpoint<{}, CheckTokenResponse>,

    CosmeticList:       () => "/item" as DeclareEndpoint<{}, CosmeticItemsResponse>,
    CosmeticItem:       (cosmeticId: string) => `/item/${cosmeticId}` as DeclareEndpoint<{}, CosmeticItemResponse>,
    CosmeticItemByAuId: (auId: number) => `/item/auid/${auId}` as DeclareEndpoint<{}, CosmeticItemResponse>
};