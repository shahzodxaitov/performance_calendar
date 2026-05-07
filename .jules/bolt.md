## 2025-05-15 - Batch Notification Optimization
**Learning:** Sequential network requests in batch loops (like reminder checks) cause linear latency scaling. Additionally, O(N*M) lookups for related entities (like team members) create unnecessary CPU overhead as data grows.
**Action:** Always parallelize independent network requests using `Promise.allSettled` and use `Map` for entity lookups in loops to ensure O(N+M) complexity. Ensure state updates only occur for successful requests by checking response status or fulfillment values.
