import axios from 'axios';
import type { Contact, Product, Sale, PaginatedResponse } from '../types';

const FM_HOST = import.meta.env.VITE_FM_HOST;
const FM_DB = import.meta.env.VITE_FM_DATABASE;
const FM_USER = import.meta.env.VITE_FM_USER;
const FM_PWD = import.meta.env.VITE_FM_PASSWORD;

// Layout names
const LAYOUTS = {
    CONTACTS: 'CMT_Web',
    PRODUCTS: 'PRD_Web',
    LOTS: 'ITY_Web',
    SALES: 'SLS_Web',
};

const isDev = import.meta.env.DEV;
const baseURL = isDev
    ? `/fmi/data/vLatest/databases/${FM_DB}`
    : `https://${FM_HOST}/fmi/data/vLatest/databases/${FM_DB}`;

export const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let token: string | null = null;

const getToken = async () => {
    if (token) return token;

    const auth = btoa(`${FM_USER}:${FM_PWD}`);
    try {
        const url = isDev
            ? `/fmi/data/vLatest/databases/${FM_DB}/sessions`
            : `https://${FM_HOST}/fmi/data/vLatest/databases/${FM_DB}/sessions`;

        const response = await axios.post(
            url,
            {},
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        token = response.data.response.token;
        return token;
    } catch (error) {
        console.error('Error fetching FileMaker token:', error);
        throw error;
    }
};

apiClient.interceptors.request.use(async (config) => {
    if (!config.url?.endsWith('/sessions')) {
        const t = await getToken();
        if (t) {
            config.headers.Authorization = `Bearer ${t}`;
        }
    }
    return config;
});

// Helper to handle pagination and mixed search/list requests
const fetchRecords = async <T>(
    layout: string,
    page: number = 1,
    limit: number = 20,
    query?: any[],
    sort?: any[]
): Promise<PaginatedResponse<T>> => {
    if (!FM_HOST) return { data: [], totalCount: 0, foundCount: 0 }; // Mock fallback handled in specific methods

    // FileMaker offset is 1-based (1 = first record)
    const offset = (page - 1) * limit + 1;

    try {
        let response;
        if (query && query.length > 0) {
            console.log(`[FM] Finding in ${layout}:`, { query, limit, offset, sort });
            response = await apiClient.post(`/layouts/${layout}/_find`, {
                query: query,
                limit: limit,
                offset: offset,
                sort: sort
            });
        } else {
            console.log(`[FM] Getting records from ${layout}:`, { limit, offset, sort });
            response = await apiClient.get(`/layouts/${layout}/records`, {
                params: {
                    _limit: limit,
                    _offset: offset,
                    _sort: sort ? JSON.stringify(sort) : undefined // Note: GET sorting syntax might differ, kept simple
                }
            });
        }

        console.log(`[FM] Response from ${layout}:`, response.status);

        const responseBody = response.data?.response;
        // Verify structure
        if (!responseBody) {
            console.warn(`[FM] Unexpected response structure from ${layout}`, response.data);
            return { data: [], totalCount: 0, foundCount: 0 };
        }

        const data = responseBody.data || [];
        const dataInfo = responseBody.dataInfo || {};

        return {
            data: data,
            totalCount: dataInfo.totalRecordCount || 0,
            foundCount: dataInfo.foundCount || 0
        };
    } catch (error: any) {
        console.error(`[FM] Error fetching ${layout}:`, error.message, error.response?.data);
        // 401 in find means "no records match" (FileMaker quirk)
        if (error.response && (error.response.data?.messages?.[0]?.code === '401' || error.response.status === 401)) {
            return { data: [], totalCount: 0, foundCount: 0 };
        }
        return { data: [], totalCount: 0, foundCount: 0 };
    }
};

// Mock Data (Updated to support basic "all" return for simplicity in dev without server)
const getMockContacts = () => [
    { fieldData: { USSMID: '101', ContactName: 'Alice Smith', ContactType: 'Staff', SalesContactName: 'John', SalesContactPhone: '123', SalesContactEmail: 'a@a.com', LastSalesDate: '01/01/2023' }, recordId: '1' },
    { fieldData: { USSMID: '102', ContactName: 'Bob Jones', ContactType: 'Customer', SalesContactName: 'Jane', SalesContactPhone: '456', SalesContactEmail: 'b@b.com', LastSalesDate: '02/01/2023' }, recordId: '2' },
];
const getMockProducts = () => [
    { fieldData: { ProductName: 'Super Gadget', ItemNo: 'SG-001', ProductCost_c: 99.99, ProductCategory: 'Hardware', CurrentInventory_w: 10, DefaultPackSize: 1, UnitType: 'Unit' }, recordId: '101' },
    { fieldData: { ProductName: 'Mega Widget', ItemNo: 'MW-002', ProductCost_c: 149.50, ProductCategory: 'Hardware', CurrentInventory_w: 5, DefaultPackSize: 12, UnitType: 'Box' }, recordId: '102' },
];
const getMockSales = () => [
    { fieldData: { SalesKey_Display: '1002', SalesStatus_new: 'Open', SalesDate: '02/01/2023', Total_Static_Display: '2,300.50', ContactName_BillTo: 'Client B', InvoiceNo: 124, InvoiceDate: '02/01/2023', UssmID: 'U2' }, recordId: '202' },
];

export const filemaker = {


    getSale: async (id: string) => {
        if (!FM_HOST) return getMockSales()[0];
        try {
            const response = await apiClient.get(`/layouts/${LAYOUTS.SALES}/records/${id}`);
            return response.data.response.data[0];
        } catch (error) {
            console.error('Failed to fetch sale', error);
            throw error;
        }
    },

    getLineItems: async (salesKeyProducts: string) => {
        if (!FM_HOST) return [];
        try {
            // Layout for Line Items
            const LIC_LAYOUT = 'LIC_Web';
            const response = await apiClient.post(`/layouts/${LIC_LAYOUT}/_find`, {
                query: [{ SalesKeyProducts: `=${salesKeyProducts}` }],
                limit: 500 // Fetch decent amount of lines
            });
            return response.data.response.data;
        } catch (error: any) {
            // 401 means no lines found
            if (error.response && error.response.status === 401) return [];
            console.error('Failed to fetch line items', error);
            return [];
        }
    },
    getContacts: async (page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Contact>> => {
        if (!FM_HOST) return { data: getMockContacts(), totalCount: 2, foundCount: 2 };

        const query = search ? [{ ContactName: `*${search}*` }, { USSMID: `*${search}*` }] : undefined;
        return fetchRecords<Contact>(LAYOUTS.CONTACTS, page, limit, query);
    },

    getContact: async (id: string) => {
        if (!FM_HOST) return getMockContacts()[0];
        try {
            const response = await apiClient.get(`/layouts/${LAYOUTS.CONTACTS}/records/${id}`);
            return response.data.response.data[0];
        } catch (error) {
            console.error('Failed to fetch contact', error);
            throw error;
        }
    },

    getProducts: async (page = 1, limit = 20, search = ''): Promise<PaginatedResponse<Product>> => {
        if (!FM_HOST) return { data: getMockProducts(), totalCount: 2, foundCount: 2 };

        const query = search ? [{ ProductName: `*${search}*` }, { ItemNo: `*${search}*` }] : undefined;
        return fetchRecords<Product>(LAYOUTS.PRODUCTS, page, limit, query);
    },

    getProduct: async (id: string) => {
        if (!FM_HOST) return getMockProducts()[0];
        try {
            const response = await apiClient.get(`/layouts/${LAYOUTS.PRODUCTS}/records/${id}`);
            return response.data.response.data[0];
        } catch (error) {
            console.error('Failed to fetch product', error);
            throw error;
        }
    },

    getLots: async (itemNo: string) => {
        if (!FM_HOST) return [];
        try {
            const response = await apiClient.post(`/layouts/${LAYOUTS.LOTS}/_find`, {
                query: [{ ItemNo: `=${itemNo}` }]
            });
            return response.data.response.data;
        } catch (error) {
            return [];
        }
    },

    getSales: async (
        page = 1,
        limit = 20,
        search = '',
        startDate?: string,
        endDate?: string
    ): Promise<PaginatedResponse<Sale>> => {
        if (!FM_HOST) return { data: getMockSales(), totalCount: 2, foundCount: 2 };

        const query: any[] = [];

        // Date Logic
        if (startDate && endDate) {
            // FileMaker Date Range Format: start...end
            query.push({ SalesDate: `${startDate}...${endDate}` });
        } else if (startDate) {
            query.push({ SalesDate: `>=${startDate}` });
        }

        // Search Logic
        if (search) {
            // Note: Mixing date range and search in one find requires combined requests or careful structuring
            // FileMaker AND logic is same object, OR logic is array of objects.
            // If we want (Date AND (Search OR Search)), it's complex.
            // Simplified: If search exists, prioritize search, or add date range to EACH search object.

            const searchTerms = [
                { InvoiceNo: `=${search}` }, // Exact match for ID usually best
                { ContactName_BillTo: `*${search}*` },
                { SalesKey_Display: `=${search}` }
            ];

            if (startDate && endDate) {
                // Add date constraint to every Search OR condition to enforce AND
                searchTerms.forEach(term => {
                    (term as any).SalesDate = `${startDate}...${endDate}`;
                });
                // If query had just date, clear it and use these
                query.length = 0;
                query.push(...searchTerms);
            } else {
                query.push(...searchTerms);
            }
        }

        // Base criteria: IsSale = 1 AND Revision_NextCreated is empty
        const baseCriteria = {
            IsSale: '1',
            Revision_NextCreated: '='
        };

        // If no specific query yet, start with one empty object to merge into
        if (query.length === 0) {
            query.push({});
        }

        // Apply base criteria to EVERY query object (AND logic distribution)
        query.forEach(q => {
            Object.assign(q, baseCriteria);
        });

        // Sort by SalesDate descending
        const sort = [{ fieldName: 'SalesDate', sortOrder: 'descend' }];

        return fetchRecords<Sale>(LAYOUTS.SALES, page, limit, query, sort);
    },
    getProductByItemNo: async (itemNo: string): Promise<Product | null> => {
        if (!FM_HOST) return getMockProducts().find(p => p.fieldData.ItemNo === itemNo) || null;
        try {
            const response = await apiClient.post(`/layouts/${LAYOUTS.PRODUCTS}/_find`, {
                query: [{ ItemNo: `=${itemNo}` }]
            });
            return response.data.response.data[0];
        } catch (error) {
            console.error('Failed to fetch product by ItemNo', error);
            return null;
        }
    },
};
