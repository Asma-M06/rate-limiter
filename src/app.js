const express = require("express");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();
app.use(express.json()); // Essential for modern APIs

// --- API ROUTES ---

// 1. Standard Route (Cost = 1)
app.get("/api/data", rateLimiter, (req, res) => {
    res.json({ 
        message: "You accessed standard data.",
        usage_info: "This call cost 1 credit."
    });
});

// 2. Heavy Resource Route (Cost = 2 for Enterprise)
app.get("/api/heavy-data", rateLimiter, (req, res) => {
    res.json({ 
        message: "You accessed heavy resources.",
        usage_info: "This call cost 2 credits for Enterprise users."
    });
});

// 3. Admin Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", database: "Redis" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-> Tiered API System running on port ${PORT}`);
    console.log(`-> Test FREE: No key or random key`);
    console.log(`-> Test PRO: Header x-api-key: pro_123`);
    console.log(`-> Test ENTERPRISE: Header x-api-key: ent_999`);
});