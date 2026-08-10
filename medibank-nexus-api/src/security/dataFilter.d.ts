/**
 * Filter a patient object for the given role.
 */
export declare function filterPatient(patient: Record<string, any>, role: string, requesterEmail?: string | null): any;
/**
 * Filter an array of patients.
 */
export declare function filterPatients(patients: Array<Record<string, any>>, role: string, requesterEmail?: string | null): Array<any>;
/**
 * Pharmacists see only prescription-relevant visit fields.
 * Patients see their own visits but not the full clinical notes.
 */
export declare function filterVisit(visit: Record<string, any>, role: string): any;
/**
 * Strip password from any user object before sending in a response.
 */
export declare function safeUser(user: Record<string, any> | null | undefined): any;
/**
 * For staff listing, non-admin roles see limited staff info.
 */
export declare function filterStaff(member: Record<string, any>, requestorRole: string): any;
import { Request, Response, NextFunction } from 'express';
export declare function dataFilterMiddleware(req: Request & {
    user?: any;
}, res: Response, next: NextFunction): void;
