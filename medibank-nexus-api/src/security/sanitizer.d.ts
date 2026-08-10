import { Request, Response, NextFunction } from 'express';
export declare function cleanXSS(val: any): any;
export declare function xssSanitizer(req: Request, res: Response, next: NextFunction): void;
export declare const hppProtection: any;
export declare function deepSanitizer(req: Request, _res: Response, next: NextFunction): void;
export declare function requestSizeGuard(maxBytes?: number): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function enforceJsonContentType(req: Request, res: Response, next: NextFunction): any;
