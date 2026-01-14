const RATE_LIMIT = 5;
const requestStore = {};

const rateLimiter = (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
        return res.status(401).json({ message: "Api key missing" })
    }


    const currentTime = Date.now();

    if (!requestStore[apiKey]) {
        requestStore[apiKey] = {
            count: 1,
            startTime: currentTime
        };
        return next();
    }

    const elapsedTime = currentTime - requestStore[apiKey].startTime;

    if (elapsedTime > 24 * 60 * 60 * 1000) {
        requestStore[apiKey] = {
            count: 1,
            startTime: currentTime
        };
        return next();
    }

    if (requestStore[apiKey].count > RATE_LIMIT) {
        return res.status(429).json({ message: "Rate limit exceeded" })
    }

    requestStore[apiKey].count++;
    next();

};

module.exports = rateLimiter;
