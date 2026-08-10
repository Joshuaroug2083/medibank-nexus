export class PatientRepository {
    static getAll(hospitalId: any): Promise<any[]>;
    static findById(id: any, hospitalId: any): Promise<any>;
    static findByNameOrId(hospitalId: any, q: any, limit: any, offset: any): Promise<{
        rows: any[];
        count: number;
    }>;
    static findLastPatient(hospitalId: any, prefix: any): Promise<any>;
    static create(patientData: any): Promise<any>;
    static update(id: any, hospitalId: any, patchData: any): Promise<any>;
    static getVisits(patientId: any, limit?: number): Promise<any[]>;
}
