## 2025-05-15 - Optimized Task Reminders Batch Job

**Learning:** Batch operations that perform sequential lookups and network requests scale poorly. Replacing O(N*M) linear searches with an O(N+M) Map and parallelizing independent API calls using `Promise.allSettled` is essential for performance and reliability.

**Action:** Always use Map-based lookups for related entities in loops and parallelize notifications to minimize execution latency in serverless environments.
