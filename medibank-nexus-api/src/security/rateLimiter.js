import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from './redisClient.js';
async function makeStore(prefix) {
    try {
        const redis = await getRedis();
        if (typeof redis.call !== 'function')
            return undefined; // memory fallback client
        return new RedisStore({
            sendCommand: (...args) => redis.call(...args),
            prefix,
        });
    }
    catch {
        return undefined;
    }
}
const handler = (req, res) => {
    res.status(429).json({
        error: 'Too many requests',
        message: 'You have made too many requests in a short period. Please wait and try again.',
        retryAfter: res.getHeader('Retry-After'),
    });
};
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_GENERAL ?? '100'),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? '',
    handler,
    skip: (req) => req.path === '/health',
});
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH ?? '10'),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = (req.body?.email ?? '').toLowerCase().trim();
        return email ? `${req.ip}:${email}` : (req.ip ?? '');
    },
    handler,
});
export const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? '',
    handler,
});
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ?? req.ip ?? '',
    handler,
});
export async function attachRedisStores() {
    const [generalStore, authStore, strictStore, aiStore] = await Promise.all([
        makeStore('rl:general:'),
        makeStore('rl:auth:'),
        makeStore('rl:strict:'),
        makeStore('rl:ai:'),
    ]);
    if (generalStore)
        generalLimiter.store = generalStore;
    if (authStore)
        authLimiter.store = authStore;
    if (strictStore)
        strictLimiter.store = strictStore;
    if (aiStore)
        aiLimiter.store = aiStore;
}
//# sourceMappingURL=rateLimiter.js.map