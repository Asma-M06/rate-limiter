const redis = require("redis");
const client = redis.createClient();

//connet to redis
(async () => {
    client.connect();
})();

const rateLimiter = async (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    console.log("Detected API Key:", apiKey);
    if (!apiKey) return res.status(401).json({ message: "Api key missing" })


    const tier = {
        'free': { limit: 5, windowMS: 60000 },
        'pro': { limit: 100, windowMS: 60000 },
        'enterprise': { limit: 1000, windowMs: 60000 }
    };

    let userTier = 'free';
    if (apiKey.startsWith('pro_')) userTier = 'pro';
    if (apiKey.startsWith('ent_')) userTier = 'enterprise';

    const { limit, windowMS } = tier[userTier];

    const now = Date.now();
    const key = ` rate_limit:${apiKey}`;

    try {
        await client.zRemRangeByScore(key, 0, now - windowMS);
        const requestCount = await client.zCard(key);

        const cost = req.path === '/heavy-data' ? 2 : 1;
        if (requestCount + cost > limit) {
            return res.status(429).json(
                {
                    message: "Rate limit exceeded",
                    tier: userTier,
                    CurrentUsage: requestCount,
                    limit: limit
                }
            );
        }

        await client.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
        await client.expire(key, 60);

        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', limit - (requestCount + cost));

        next();
    }
    catch (err) {
        console.error("Redis error : ", err);
        next();
    }
};

module.exports = rateLimiter;