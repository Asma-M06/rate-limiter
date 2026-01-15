const redis = require("redis");
const client = redis.createClient();

(async () => {
    try {
        await client.connect();
        console.log(" Connected to Redis");
    } catch (err) {
        console.error(" Redis Connection Failed:", err);
    }
})();

const rateLimiter = async (req, res, next) => {
    // 1. Check Global Kill Switch
    const isKilled = await client.get("global_kill_switch");
    if (isKilled === "true") {
        return res.status(503).json({ 
            message: "Service temporarily unavailable", 
            reason: "Emergency Maintenance" 
        });
    }

    const apiKey = req.headers["x-api-key"]; //
    if (!apiKey) return res.status(401).json({ message: "Api key missing" }); //

    const tier = {
        'free': { limit: 5, windowMs: 60000 }, //
        'pro': { limit: 100, windowMs: 60000 }, //
        'enterprise': { limit: 1000, windowMs: 60000 } //
    };

    let userTier = 'free'; //
    if (apiKey.startsWith('pro_')) userTier = 'pro'; //
    if (apiKey.startsWith('ent_')) userTier = 'enterprise'; //

    const { limit, windowMs } = tier[userTier]; //
    const key = `rate_limit:${apiKey}`; //
    const now = Date.now(); //

    try {
        await client.zRemRangeByScore(key, 0, now - windowMs); //
        const requestCount = await client.zCard(key); //

        const cost = req.path === '/heavy-data' ? 2 : 1; //

        // 2. SOFT LIMITING: Introduce a 2-second delay at 80% usage
        if (requestCount + cost > limit * 0.8 && requestCount + cost <= limit) {
            console.log(`⚠️ Throttling user ${apiKey} (80% usage reached)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 3. HARD LIMITING
        if (requestCount + cost > limit) { //
            await client.incr(`blocked_logs:${apiKey}`);
            await client.expire(`blocked_logs:${apiKey}`, 3600); 
            return res.status(429).json({
                message: "Rate limit exceeded", //
                tier: userTier,
                currentUsage: requestCount,
                limit: limit
            });
        }

        await client.zAdd(key, { score: now, value: `${now}-${Math.random()}` }); //
        await client.expire(key, Math.floor(windowMs / 1000)); //

        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', limit - (requestCount + cost));

        next(); //
    } catch (err) {
        console.error("Redis error : ", err); //
        next(); 
    }
};

module.exports = { rateLimiter, client };