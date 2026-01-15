const express = require("express");
const path = require("path");
const { rateLimiter, client } = require("./middleware/rateLimiter");

const app = express();

// Serve the UI files from a 'public' folder
app.use(express.static('public'));

// --- EXISTING DATA ROUTE ---
app.get("/api/data", rateLimiter, (req, res) => {
    res.json({ message: "you accessed the protected data" });
});

// --- NEW ADMIN API ROUTE ---
app.get("/admin/usage", async (req, res) => {
    try {
        const usageKeys = await client.keys("rate_limit:*");
        const blockedKeys = await client.keys("blocked_logs:*");

        const usageDetails = await Promise.all(usageKeys.map(async (key) => {
            const apiKey = key.replace("rate_limit:", "");
            const count = await client.zCard(key);

            // Get blocked count for this specific key
            const blockedCount = await client.get(`blocked_logs:${apiKey}`) || 0;

            return {
                apiKey: apiKey.trim(),
                currentRequests: count,
                blockedRequests: parseInt(blockedCount)
            };
        }));

        res.json({ usageDetails });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// --- UI DASHBOARD ROUTE ---
app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
    console.log(" Server running on port 3000");
    console.log(" Dashboard available at http://localhost:3000/dashboard");
});