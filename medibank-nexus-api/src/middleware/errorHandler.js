/**
 * Centralized Error Classes and Middleware
 */

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

const isProd = process.env.NODE_ENV === 'production';

export function errorHandler(err, req, res, next) {
  /* CORS errors */
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  const status = err.statusCode ?? err.status ?? 500;

  /* Log full error server-side */
  console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);
  if (status === 500) console.error(err.stack);

  /* Client response: never expose internals in production */
  return res.status(status).json({
    error: isProd && status === 500
      ? 'An unexpected error occurred. Please try again.'
      : err.message,
    ...(err.errors && err.errors.length ? { errors: err.errors } : {}),
    ...(isProd ? {} : { stack: err.stack }),
  });
}
