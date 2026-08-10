export class PatientService {
    static getPatientIdForUser(userId: any, userEmail: any, hospitalId: any): Promise<any>;
    static nextPatientId(hospitalId: any): Promise<string>;
    static listPatients(hospitalId: any, { q, page, limit }: {
        q: any;
        page?: number | undefined;
        limit?: number | undefined;
    }, userRole: any, userEmail: any): Promise<{
        patients: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    static registerPatient(hospitalId: any, user: any, body: any): Promise<any>;
    static getPatientById(id: any, hospitalId: any, userRole: any, userEmail: any): Promise<{
        patient: any;
        visits: any[];
    }>;
    static updatePatient(id: any, hospitalId: any, user: any, body: any): Promise<any>;
}
