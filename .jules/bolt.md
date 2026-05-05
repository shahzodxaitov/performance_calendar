## 2025-05-14 - Batch Notification Optimization
**Learning:** Sequential network requests in loops (O(N) latency) and nested lookups (O(N*M)) are the primary bottlenecks in batch background jobs like reminder checks.
**Action:** Always parallelize independent network calls using `Promise.allSettled` and use `Map` for cross-reference lookups to achieve O(N+M) complexity. Ensure state persistence (e.g., `saveTasks`) only marks success for fulfilled promises.
