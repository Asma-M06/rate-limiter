const redis = require("redis");
const client = redis.createClient();

//connet to redis
(async () => {
    client.connect();
})();

const rateLimiter = async (req, res, next) => {
    const apiKey = req.header["x-api-key"];
    if (!apiKey) return res.status(401).json({ message: "Api key missing" })


    const tier = {
        'free': { limit: 5, windowMS: 60000 },
        'pro': { limit: 100, windowMS: 60000 }
    };

    const userTier = apiKey === "pro-secret-key" ? 'pro' : 'free';
    const { limit, windowMS } = tier[userTier];

    const now = Date.now();
    const key = ` rate_limit:${apiKey}`;

    try {
        await client.zRemRangeByScore(key, 0, now - windowMS);
        const requestCount = await client.zCard(key);

        if (requestCount >= limit) {
            return res.status(429).json(
                {
                    message: "Rate limit exceeded",
                    tier: userTier,
                    limit: limit
                }
            );
        }

        await client.zAdd(key, { score: now, value: now.toString() });
        await client.expire(key, Math.floor(windowMS / 1000));

        next();
    }
    catch (err) {
        console.error("Redis error : ", err);
        next();
    }
};

module.exports = rateLimiter;