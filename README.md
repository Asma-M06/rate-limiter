# API Rate Limiter : Distributed Rate Limiter & Monitoring Dashboard

A production-grade API rate limiting service built with **Node.js** and **Redis**. This project implements a **Sliding Window Log** algorithm to manage user quotas across multiple tiers and features a real-time administrative dashboard.

## Key Features
* **Distributed Rate Limiting:** Uses Redis Sorted Sets for millisecond-precision request tracking.
* **Multi-Tier Quotas:** Distinct limits for Free, Pro, and Enterprise users based on API key prefixes.
* **Dynamic Throttling:** Automatically injects a 2000ms delay when users hit 80% of their quota to prevent hard-blocking.
* **Global Kill Switch:** A centralized circuit breaker to halt all traffic instantly via a Redis-backed flag.
* **Real-time Dashboard:** A modern, glassmorphism UI for monitoring traffic distribution and blocked requests.

## Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** Redis (Sorted Sets, TTLs, Key-Value)
* **Frontend:** Tailwind CSS, Chart.js, FontAwesome

## Testing the Limits
1. **Free Tier:** Send 5 requests with `x-api-key: user_123`. The 6th request will return a `429` error.
2. **Throttling:** Reach 4 requests (80% of 5). Notice the 2-second delay on the 4th request.
3. **Emergency Kill:** Click "Emergency Kill" on the dashboard. All subsequent API calls will return a `503`.