## 2025-05-15 - [Optimized task reminder notifications]
**Learning:** Parallelizing network requests using `Promise.allSettled` in batch operations significantly reduces API latency, especially when dealing with external services like Telegram. Additionally, replacing linear searches in loops with `Map` lookups reduces algorithmic complexity from O(N*M) to O(N+M).
**Action:** Always prefer parallelizing independent network calls and using hash-based lookups for related entities in batch processing routes.
