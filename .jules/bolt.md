# Bolt's Performance Journal

## 2025-05-15 - Optimizing Batch Notification Complexity and Latency
**Learning:** Correlating two data sets (Tasks and Team Members) using nested loops creates O(N*M) complexity. For periodic tasks like reminder checks, this can scale poorly. Furthermore, awaiting network requests (Telegram API) sequentially in a loop is a major bottleneck due to cumulative RTT (Round Trip Time).
**Action:** Always use a `Map` for lookups to achieve O(N+M) complexity. Use `Promise.allSettled` to parallelize independent network requests, which reduces the total execution time from sum(latencies) to max(latency).
