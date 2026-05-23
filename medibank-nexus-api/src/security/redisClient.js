/**
 * Redis client — shared singleton used by:
 *   - JWT token blacklist
 *   - Rate limiters
 *   - Account lockout tracker
 *
 * Falls back to a lightweight in-memory store when Redis is unavailable
 * (development without Redis). Production MUST use Redis.
 */
import Redis from 'ioredis';

let client;

function createClient() {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';

  const redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck:     true,
    lazyConnect:          true,
    connectTimeout:       5000,
    retryStrategy(times) {
      if (times > 3) return null;   // stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect',       () => console.log('[Redis] Connected'));
  redis.on('error',  (err) => console.error('[Redis] Error:', err.message));
  redis.on('close',        () => console.warn('[Redis] Connection closed'));

  return redis;
}

/* ─── In-memory fallback (dev only) ───────────────────────────── */
class MemoryStore {
  constructor() {
    this._store = new Map();
    /* Clean up expired keys every 5 minutes */
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this._store) {
        if (v.exp && v.exp < now) this._store.delete(k);
      }
    }, 300_000);
  }
  async get(key) {
    const entry = this._store.get(key);
    if (!entry)                              return null;
    if (entry.exp && entry.exp < Date.now()) { this._store.delete(key); return null; }
    return entry.val;
  }
  async set(key, val, exMode, ttlSec) {
    const exp = exMode === 'EX' ? Date.now() + ttlSec * 1000 : undefined;
    this._store.set(key, { val, exp });
    return 'OK';
  }
  async setex(key, ttlSec, val)  { return this.set(key, val, 'EX', ttlSec); }
  async del(key)                 { this._store.delete(key); return 1; }
  async incr(key) {
    const cur = parseInt((await this.get(key)) ?? '0');
    const next = cur + 1;
    const entry = this._store.get(key);
    this._store.set(key, { val: String(next), exp: entry?.exp });
    return next;
  }
  async expire(key, ttlSec) {
    const entry = this._store.get(key);
    if (entry) { entry.exp = Date.now() + ttlSec * 1000; }
    return 1;
  }
  async ttl(key) {
    const entry = this._store.get(key);
    if (!entry || !entry.exp) return -1;
    return Math.ceil((entry.exp - Date.now()) / 1000);
  }
  async exists(key)              { return (await this.get(key)) !== null ? 1 : 0; }
}

let _fallback;

export async function getRedis() {
  if (client) return client;

  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    throw new Error('REDIS_URL is required in production');
  }

  try {
    const redis = createClient();
    await redis.connect();
    client = redis;
    return client;
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Redis connection failed in production: ${err.message}`);
    }
    console.warn('[Redis] Falling back to in-memory store (dev only)');
    _fallback = _fallback ?? new MemoryStore();
    client = _fallback;
    return client;
  }
}

export default { getRedis };
