/**
 * Role-Based Access Control middleware factory.
 *
 * Usage:
 *   import { allow } from './middleware/rbac.js';
 *
 *   router.get('/admin-only', authenticate, allow('admin'), handler);
 *   router.get('/clinical',   authenticate, allow('doctor', 'nurse'), handler);
 */

export function allow(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
}

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
export function tenantGuard(source = 'params') {
  return (req, res, next) => {
    const requestedId = source === 'params'
      ? req.params.hospitalId
      : req.query.hospitalId;

    if (requestedId && requestedId !== req.user.hospitalId) {
      return res.status(403).json({ error: 'Access to another tenant is not allowed' });
    }
    next();
  };
}
