export class BillingService {
    static handlePaystackWebhook(headers: any, rawBody: any): Promise<void>;
    static getSubscription(hospitalId: any): Promise<{
        tier: any;
        status: any;
        trialEndDate: any;
        lastPayment: any;
        staffCount: number;
    }>;
    static upgradeSubscription(hospitalId: any, user: any): Promise<{
        reference: string;
        email: any;
        amount: number;
        currency: string;
        paystackKey: string | undefined;
        metadata: {
            custom_fields: {
                display_name: string;
                variable_name: string;
                value: any;
            }[];
        };
    }>;
    static nextInvoiceId(hospitalId: any): Promise<string>;
    static listInvoices(hospitalId: any, { status, patientId, from, to, page, limit }: {
        status: any;
        patientId: any;
        from: any;
        to: any;
        page?: number | undefined;
        limit?: number | undefined;
    }): Promise<{
        invoices: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    static createInvoice(hospitalId: any, user: any, body: any): Promise<any>;
    static getInvoiceDetail(invoiceId: any, hospitalId: any, user: any): Promise<any>;
    static recordPayment(invoiceId: any, hospitalId: any, user: any, body: any): Promise<any>;
    static getRevenueSummary(hospitalId: any, { from, to }: {
        from: any;
        to: any;
    }): Promise<any>;
    static getInvoicesForPatient(patientId: any, hospitalId: any, user: any): Promise<any[]>;
}
