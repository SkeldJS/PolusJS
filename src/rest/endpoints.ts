import { AccountLoginRequest } from "./requests";

import {
    AccountLoginResponse,
    CheckTokenResponse,
    GetAllCosmeticsResponse,
    GetAllPurchasesResponse,
    GetBundleResponse,
    GetBundleListResponse,
    GetCosmeticResponse,
    GetPurchaseResponse
} from "./responses";

export type Endpoint<
    JSONParams extends Record<string, any> = {},
    ResponseType extends Record<string, any> = {}
> = string & { req: JSONParams } & { res: ResponseType };

export const ApiEndpoints = {
    AccountLogin:      ()                   => "/auth/token"              as Endpoint<AccountLoginRequest, AccountLoginResponse>,
    CheckToken:        ()                   => "/auth/check"              as Endpoint<{}, CheckTokenResponse>,

    GetAllCosmetics:   ()                   => "/item"                    as Endpoint<{}, GetAllCosmeticsResponse>,
    GetAllPurchases:   ()                   => "/purchases"               as Endpoint<{}, GetAllPurchasesResponse>,

    GetBundle:         (bundleId: string)   => `/item/${bundleId}`        as Endpoint<{}, GetBundleResponse>,
    GetBundleList:     ()                   => "/bundle"                  as Endpoint<{}, GetBundleListResponse>,

    GetCosmetic:       (cosmeticId: string) => `/item/${cosmeticId}`      as Endpoint<{}, GetCosmeticResponse>,
    GetCosmeticByAuId: (auId: number)       => `/item/auid/${auId}`       as Endpoint<{}, GetCosmeticResponse>,
    GetPurchase:       (purchaseId: string) => `/purchases/${purchaseId}` as Endpoint<{}, GetPurchaseResponse>
};