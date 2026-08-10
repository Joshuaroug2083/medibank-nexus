export function errorHandler(err: any, req: any, res: any, next: any): any;
/**
 * Centralized Error Classes and Middleware
 */
export class AppError extends Error {
    constructor(message: any, statusCode?: number);
    statusCode: number;
    status: number;
}
export class AuthError extends AppError {
    constructor(message?: string);
}
export class ForbiddenError extends AppError {
    constructor(message?: string);
}
export class NotFoundError extends AppError {
    constructor(message?: string);
}
export class ValidationError extends AppError {
    constructor(message?: string, errors?: any[]);
    errors: any[];
}
