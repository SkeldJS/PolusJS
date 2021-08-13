import { AccountLoginRequest } from "./requests";
import { AccountLoginResponse, CheckTokenResponse } from "./responses";

export type DeclareEndpoint<
    JSONParams extends Record<string, any> = {},
    ResponseType extends Record<string, any> = {}
> = string & { req: JSONParams } & { res: ResponseType };

export const ApiEndpoints = {
    AccountLogin: () => "/auth/token" as DeclareEndpoint<AccountLoginRequest, AccountLoginResponse>,
    CheckToken: () => "/auth/check" as DeclareEndpoint<{}, CheckTokenResponse>
}