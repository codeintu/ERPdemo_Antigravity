export interface Contact {
    recordId: string;
    fieldData: {
        USSMID: string;
        ContactName: string;
        ContactType: string;
        SalesContactName: string;
        SalesContactPhone: string;
        SalesContactEmail: string;
        LastSalesDate: string;
        [key: string]: any;
    };
}

export interface Product {
    recordId: string;
    fieldData: {
        ItemNo: string;
        ProductName: string;
        ProductCategory: string;
        ProductCost_c?: number | string;
        CurrentInventory_w?: number | string;
        UnitType?: string;
        DefaultPackSize?: string | number;
        [key: string]: any;
    };
}

export interface Lot {
    recordId: string;
    fieldData: {
        ItemNo: string;
        SerialNo: string;
        WarehouseName: string;
        MfgDate: string;
        ExpDate: string;
        LotNo_QtyAll: number | string;
        LotNo_QtyUsed: number | string;
        LotNo_QtyTransferOut: number | string;
        LotNo_QtyTransferIn: number | string;
        LotNo_CurrentInventory_Static: number | string;
        INVTransferStatus: string;
        Cost: number | string;
        [key: string]: any;
    };
}

export interface Sale {
    recordId: string;
    fieldData: {
        SalesKey_Display: string;
        SalesStatus_new: string;
        SalesDate: string;
        UssmID: string;
        ContactName_BillTo: string;
        InvoiceNo: number;
        Total_Static_Display: string;
        InvoiceDate: string;
        [key: string]: any;
    };
}

export interface LineItem {
    recordId: string;
    fieldData: {
        ItemNo: string;
        ProductDescription: string;
        Quantity: number;
        PriceOfSale: number;
        LinePrice: number;
        SerialNo: string;
        UnitType: string;
        SalesKeyProducts: string;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    totalCount: number;
    foundCount: number;
}
