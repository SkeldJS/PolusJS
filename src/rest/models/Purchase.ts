export interface PurchaseModel {
    id: string;
    bundleId: string;
    cost: number;
    purchaser: string;
    timeCreated: number;
    timeFinalized: number;
    finalized: boolean;
    vendorData: {
        name: string;
        note: string;
    }
}