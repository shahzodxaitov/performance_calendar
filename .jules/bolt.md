## 2025-05-15 - Optimized Task Reminder Batch Processing
**Learning:** Parallelizing independent network requests using `Promise.allSettled` in batch operations significantly reduces execution time from O(N * latency) to O(latency). Replacing linear searches inside loops with a `Map` lookup reduces algorithmic complexity from O(N * M) to O(N + M).
**Action:** Always prefer Map lookups for related entity retrieval in loops and use `Promise.allSettled` for batch notifications to ensure optimal performance.
