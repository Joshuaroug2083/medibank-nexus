/** Middleware: run validators and return 400 if any fail */
export function validate(req: any, res: any, next: any): any;
export const loginRules: import("express-validator").ValidationChain[];
export const changePasswordRules: import("express-validator").ValidationChain[];
export const hospitalRules: import("express-validator").ValidationChain[];
export const addStaffRules: import("express-validator").ValidationChain[];
export const patientRules: import("express-validator").ValidationChain[];
export const visitRules: import("express-validator").ValidationChain[];
export const prescriptionRules: import("express-validator").ValidationChain[];
export const appointmentRules: import("express-validator").ValidationChain[];
export function uuidParam(paramName: any): import("express-validator").ValidationChain;
export const paginationRules: import("express-validator").ValidationChain[];
