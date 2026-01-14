const express = require("express");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

app.get("/api/data",rateLimiter,(req,res)=>{
    res.json({message:"you accessed the protected data"});
})
app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})