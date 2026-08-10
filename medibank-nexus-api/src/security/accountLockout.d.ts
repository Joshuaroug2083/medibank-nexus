export function recordFailedAttempt(email: any, ip: any): Promise<{
    emailCount: any;
    ipCount: any;
}>;
export function clearAttempts(email: any, ip: any): Promise<void>;
export function isLocked(email: any): Promise<boolean>;
export function getLockoutTTL(email: any): Promise<any>;
export function getAttemptCount(email: any): Promise<number>;
export function unlockAccount(email: any): Promise<void>;
export function lockoutGuard(req: any, res: any, next: any): Promise<any>;
