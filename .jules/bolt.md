## 2026-04-13 - Concurrent Notifications & Lookup Optimization
**Learning:** Sequential await loops (O(N) network requests) block the serverless execution environment, drastically increasing execution time and function timeout risk. In addition, nested search loops (O(N * M)) can be optimized to O(N + M) by caching lookups in a JavaScript Map.
**Action:** Always parallelize state-modifying batch processes with `Promise.allSettled`, update tasks atomically on success, and optimize nested iterations via a hash map.
