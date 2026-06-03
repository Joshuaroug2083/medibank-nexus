import { Router }  from 'express';
import bcrypt       from 'bcrypt';
import jwt          from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db           from '../db.js';
import authenticate from '../middleware/auth.js';
import { audit }    from '../middleware/audit.js';
import {
  authLimiter,
  strictLimiter,
}                   from '../security/rateLimiter.js';
import {
  lockoutGuard,
  recordFailedAttempt,
  clearAttempts,
}                   from '../security/accountLockout.js';
import {
  blacklistToken,
  revokeAllUserTokens,
  getUserRevocationTime,
}                   from '../security/tokenBlacklist.js';
import { secureToken } from '../security/encryption.js';
import { safeUser }    from '../security/dataFilter.js';
import {
  loginRules,
  changePasswordRules,
  validate,
}                   from '../security/validator.js';

const router = Router();

/* ── Token helpers ───────────────────────────────────────────── */
function issueAccessToken(user) {
  return jwt.sign(
    {
      jti:        uuidv4(),           // unique token ID — enables blacklisting
      iat:        Math.floor(Date.now() / 1000),
      id:         user.id,
      email:      user.email,
      role:       user.role,
      name:       user.name,
      initials:   user.initials ?? '',
      dept:       user.dept    ?? '',
      hospitalId: user.hospital_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' },
  );
}

function issueRefreshToken(userId) {
  return jwt.sign(
    { jti: uuidv4(), sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d' },
  );
}

/* ── POST /api/v1/auth/login ─────────────────────────────────── */
router.post(
  '/login',
  authLimiter,
  loginRules,
  validate,
  lockoutGuard,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const normalEmail = email.trim().toLowerCase();

      const user = await db('users')
        .where({ email: normalEmail })
        .first();

      /* Always run bcrypt even on "not found" to prevent timing attacks */
      const fakeHash = '$2b$10$invalidhashfortimingnormalizationtarget';
      const match    = user
        ? await bcrypt.compare(password, user.password)
        : await bcrypt.compare(password, fakeHash).then(() => false);

      if (!user || !match) {
        await recordFailedAttempt(normalEmail, req.ip);
        audit({
          userId:     user?.id,
          hospitalId: user?.hospital_id,
          action:     'login_failed',
          level:      'warning',
          ip:         req.ip,
        });
        return res.status(401).json({ error: 'Incorrect email or password' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          error: 'Account suspended. Contact your hospital administrator.',
        });
      }

      const hospital = await db('hospitals').where({ id: user.hospital_id }).first();
      if (!hospital || hospital.status === 'suspended') {
        return res.status(403).json({ error: 'Hospital account is inactive.' });
      }

      /* Check per-user revocation (admin may have force-revoked all tokens) */
      const revokedAt = await getUserRevocationTime(user.id);
      /* If a revocation was issued in the last 8 hours, clear it on fresh login */
      if (revokedAt) {
        await revokeAllUserTokens(user.id); // reset the timer on new login
      }

      /* Success — clear lockout */
      await clearAttempts(normalEmail, req.ip);

      /* Check if 2FA is enabled */
      const totpRow = await db('totp_secrets').where({ user_id: user.id, enabled: true }).first();
      if (totpRow) {
        /* Issue a short-lived "2FA pending" token — client must call /verify-2fa */
        const tempToken = jwt.sign(
          { id: user.id, type: '2fa_pending' },
          process.env.JWT_SECRET + '_2fa',
          { expiresIn: '5m' },
        );
        audit({ userId: user.id, hospitalId: user.hospital_id, action: 'login_2fa_challenge', ip: req.ip });
        return res.status(206).json({ requires2fa: true, tempToken });
      }

      const accessToken  = issueAccessToken(user);
      const refreshToken = issueRefreshToken(user.id);

      audit({
        userId:     user.id,
        hospitalId: user.hospital_id,
        action:     'login',
        ip:         req.ip,
      });

      return res.json({
        accessToken,
        refreshToken,
        expiresIn:  process.env.JWT_EXPIRES_IN ?? '8h',
        user:       safeUser(user),
        hospital: {
          id:           hospital.id,
          name:         hospital.name,
          shortName:    hospital.short_name,
          type:         hospital.type,
          tier:         hospital.tier,
          city:         hospital.city,
          state:        hospital.state,
          primaryColor: hospital.primary_color,
          status:       hospital.status,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/* ── POST /api/v1/auth/refresh ───────────────────────────────── */
router.post('/refresh', authLimiter, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

    let payload;
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh',
      );
    } catch {
      return res.status(401).json({ error: 'Refresh token is invalid or expired' });
    }

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const user = await db('users').where({ id: payload.sub }).first();
    if (!user || user.status === 'suspended') {
      return res.status(401).json({ error: 'User no longer active' });
    }

    const newAccessToken  = issueAccessToken(user);
    const newRefreshToken = issueRefreshToken(user.id);

    audit({ userId: user.id, hospitalId: user.hospital_id, action: 'token_refresh', ip: req.ip });

    return res.json({
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn:    process.env.JWT_EXPIRES_IN ?? '8h',
    });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/auth/logout ────────────────────────────────── */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    /* Blacklist the current access token by its JTI */
    if (req.user.jti && req.user.exp) {
      await blacklistToken(req.user.jti, req.user.exp);
    }
    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'logout', ip: req.ip });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/auth/logout-all ────────────────────────────── */
/* Invalidates ALL tokens for this user (e.g. "sign out everywhere") */
router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await revokeAllUserTokens(req.user.id);
    if (req.user.jti && req.user.exp) {
      await blacklistToken(req.user.jti, req.user.exp);
    }
    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: 'logout_all', ip: req.ip });
    return res.json({ message: 'Signed out from all devices' });
  } catch (err) {
    next(err);
  }
});

/* ── GET /api/v1/auth/me ─────────────────────────────────────── */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await db('users')
      .where({ id: req.user.id, hospital_id: req.hospitalId })
      .first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/auth/change-password ───────────────────────── */
router.post(
  '/change-password',
  authenticate,
  strictLimiter,
  changePasswordRules,
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user  = await db('users').where({ id: req.user.id }).first();
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      /* Prevent re-use of same password */
      const same = await bcrypt.compare(newPassword, user.password);
      if (same) {
        return res.status(400).json({ error: 'New password must be different from your current password' });
      }

      const hashed = await bcrypt.hash(newPassword, 12);  // cost 12 — higher than default 10
      await db('users').where({ id: req.user.id }).update({ password: hashed, updated_at: new Date() });

      /* Invalidate all existing tokens after password change */
      await revokeAllUserTokens(req.user.id);
      await blacklistToken(req.user.jti, req.user.exp);

      audit({
        userId:     req.user.id,
        hospitalId: req.hospitalId,
        action:     'change_password',
        ip:         req.ip,
      });

      return res.json({ message: 'Password changed. Please sign in again.' });
    } catch (err) {
      next(err);
    }
  },
);

/* ── POST /api/v1/auth/forgot-password ──────────────────────── */
/*
 * Generates a secure reset token, stores it (hashed) in the DB,
 * and in production would send an email. In development the token
 * is returned in the response for easy testing.
 *
 * Rate limited: 5 req / 15 min to prevent enumeration.
 */
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: 'email is required' });

    const normalEmail = email.trim().toLowerCase();
    const user        = await db('users').where({ email: normalEmail }).first();

    /* Always return 200 — never reveal whether the email exists */
    const SUCCESS_MSG = 'If an account with that email exists, a password reset link has been sent.';

    if (!user || user.status === 'suspended') {
      return res.json({ message: SUCCESS_MSG });
    }

    /* Generate cryptographically secure token */
    const rawToken    = secureToken(32);
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt   = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    /* Store (upsert) the reset request */
    await db('password_resets')
      .insert({
        user_id:       user.id,
        hospital_id:   user.hospital_id,
        token_hash:    hashedToken,
        expires_at:    expiresAt,
        used:          false,
        created_at:    new Date(),
      })
      .onConflict('user_id')
      .merge(['token_hash','expires_at','used','created_at']);

    audit({ userId: user.id, hospitalId: user.hospital_id, action: 'forgot_password_request', ip: req.ip });

    /* ── Send password reset email ── */
    try {
      const { sendEmail } = await import('../services/email.js');
      const resetUrl = `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalEmail)}`;
      await sendEmail({
        to:      user.email,
        subject: 'Reset your MediBank Nexus password',
        html:    `
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your MediBank Nexus password.</p>
          <p><a href="${resetUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">Reset Password</a></p>
          <p>Or paste this token into the app: <code>${rawToken}</code></p>
          <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        `,
      });
    } catch (emailErr) {
      console.error('[Auth] Password reset email failed:', emailErr.message);
      /* Non-fatal — token is still valid, just not emailed */
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return res.json({
      message:    SUCCESS_MSG,
      /* Only expose token in development for testing */
      ...(isDev ? { devToken: rawToken, devEmail: normalEmail } : {}),
    });
  } catch (err) {
    next(err);
  }
});

/* ── POST /api/v1/auth/reset-password ───────────────────────── */
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'email, token and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const normalEmail = email.trim().toLowerCase();
    const user = await db('users').where({ email: normalEmail }).first();
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const resetRow = await db('password_resets')
      .where({ user_id: user.id, used: false })
      .where('expires_at', '>', new Date())
      .first();

    if (!resetRow) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const valid = await bcrypt.compare(token, resetRow.token_hash);
    if (!valid)  return res.status(400).json({ error: 'Invalid or expired reset token' });

    /* Hash new password and update */
    const hashed = await bcrypt.hash(newPassword, 12);
    await db('users').where({ id: user.id }).update({ password: hashed, updated_at: new Date() });

    /* Mark token as used */
    await db('password_resets').where({ user_id: user.id }).update({ used: true });

    /* Revoke all active sessions */
    await revokeAllUserTokens(user.id);

    audit({ userId: user.id, hospitalId: user.hospital_id, action: 'reset_password', ip: req.ip });

    return res.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (err) {
    next(err);
  }
});

/* ── TOTP 2FA ─────────────────────────────────────────────────
   POST /api/v1/auth/2fa/enroll   — generate TOTP secret + QR URI
   POST /api/v1/auth/2fa/confirm  — verify first TOTP code → enable 2FA
   POST /api/v1/auth/2fa/disable  — disable 2FA (requires password)
   POST /api/v1/auth/verify-2fa   — verify TOTP during login (no auth needed)
────────────────────────────────────────────────────────────────── */

/* Dynamic import of otplib — graceful if not installed */
async function getTOTP() {
  try {
    const { authenticator } = await import('otplib');
    return authenticator;
  } catch {
    return null;
  }
}

/* Generate a TOTP secret and provisioning URI */
router.post('/2fa/enroll', authenticate, async (req, res, next) => {
  try {
    const authenticator = await getTOTP();
    if (!authenticator) {
      return res.status(503).json({ error: 'TOTP library not installed. Run: npm install otplib' });
    }

    const user   = await db('users').where({ id: req.user.id }).first();
    const secret = authenticator.generateSecret(20);

    const otpauthUrl = authenticator.keyuri(
      user.email,
      'MediBank Nexus',
      secret,
    );

    /* Store the secret (unconfirmed) */
    await db('totp_secrets')
      .insert({ user_id: req.user.id, secret, enabled: false, created_at: new Date() })
      .onConflict('user_id')
      .merge(['secret', 'enabled', 'created_at']);

    return res.json({ secret, otpauthUrl });
  } catch (err) { next(err); }
});

/* Confirm first TOTP code to activate 2FA + generate backup codes */
router.post('/2fa/confirm', authenticate, async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const authenticator = await getTOTP();
    if (!authenticator) return res.status(503).json({ error: 'TOTP library not installed' });

    const row = await db('totp_secrets').where({ user_id: req.user.id }).first();
    if (!row) return res.status(400).json({ error: 'No pending 2FA enrollment found. Call /2fa/enroll first.' });

    const valid = authenticator.check(code, row.secret);
    if (!valid)  return res.status(400).json({ error: 'Invalid code. Please try again.' });

    /* Generate 8 backup codes */
    const rawCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase(),
    );
    const hashedCodes = await Promise.all(rawCodes.map(c => bcrypt.hash(c, 10)));

    await db('totp_secrets').where({ user_id: req.user.id }).update({
      enabled:      true,
      backup_codes: hashedCodes,
      enrolled_at:  new Date(),
    });

    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: '2fa_enabled', ip: req.ip });

    return res.json({ message: '2FA enabled successfully', backupCodes: rawCodes });
  } catch (err) { next(err); }
});

/* Disable 2FA */
router.post('/2fa/disable', authenticate, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'password is required' });

    const user  = await db('users').where({ id: req.user.id }).first();
    const match = await bcrypt.compare(password, user.password);
    if (!match)  return res.status(401).json({ error: 'Incorrect password' });

    await db('totp_secrets').where({ user_id: req.user.id }).delete();
    audit({ userId: req.user.id, hospitalId: req.hospitalId, action: '2fa_disabled', ip: req.ip });

    return res.json({ message: '2FA has been disabled' });
  } catch (err) { next(err); }
});

/* Verify TOTP during login challenge (uses temp JWT signed with 2fa_pending type) */
router.post('/verify-2fa', authLimiter, async (req, res, next) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ error: 'tempToken and code are required' });

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET + '_2fa');
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (payload.type !== '2fa_pending') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const authenticator = await getTOTP();
    const row = await db('totp_secrets').where({ user_id: payload.id, enabled: true }).first();

    if (!row) return res.status(400).json({ error: '2FA is not enabled for this account' });

    /* Check TOTP code or backup code */
    let valid = false;
    if (authenticator) {
      valid = authenticator.check(code, row.secret);
    }

    if (!valid) {
      /* Try backup codes */
      for (let i = 0; i < row.backup_codes.length; i++) {
        const match = await bcrypt.compare(code.toUpperCase(), row.backup_codes[i]);
        if (match) {
          /* Remove used backup code */
          const remaining = row.backup_codes.filter((_, idx) => idx !== i);
          await db('totp_secrets').where({ user_id: payload.id }).update({ backup_codes: remaining });
          valid = true;
          break;
        }
      }
    }

    if (!valid) return res.status(400).json({ error: 'Invalid authentication code' });

    const user     = await db('users').where({ id: payload.id }).first();
    const hospital = await db('hospitals').where({ id: user.hospital_id }).first();

    const accessToken  = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user.id);
    await clearAttempts(user.email, req.ip);

    audit({ userId: user.id, hospitalId: user.hospital_id, action: 'login_2fa', ip: req.ip });

    return res.json({
      accessToken, refreshToken,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
      user:      safeUser(user),
      hospital: {
        id:           hospital.id,
        name:         hospital.name,
        shortName:    hospital.short_name,
        type:         hospital.type,
        tier:         hospital.tier,
        city:         hospital.city,
        state:        hospital.state,
        primaryColor: hospital.primary_color,
        status:       hospital.status,
      },
    });
  } catch (err) { next(err); }
});

export default router;
