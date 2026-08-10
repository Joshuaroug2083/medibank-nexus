/**
 * Role-Based Access Control middleware factory.
 *
 * Usage:
 *   import { allow } from './middleware/rbac.js';
 *
 *   router.get('/admin-only', authenticate, allow('admin'), handler);
 *   router.get('/clinical',   authenticate, allow('doctor', 'nurse'), handler);
 */
export function allow(...roles: any[]): (req: any, res: any, next: any) => any;
/**
 * Tenant isolation guard.
 * Ensures the requesting user belongs to the hospital in the request context.
 * Attach after `authenticate`.
 *
 * Usage with URL param:  /hospitals/:hospitalId/something
 *   router.get('/:hospitalId/something', authenticate, tenantGuard('params'), handler);
 *
 * Usage with query param: /something?hospitalId=...
 *   router.get('/', authenticate, tenantGuard('query'), handler);
 */
export function tenantGuard(source?: string): (req: any, res: any, next: any) => any;
