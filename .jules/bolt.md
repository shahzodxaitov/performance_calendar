## 2025-05-15 - [Batch Reminder Optimization]
**Learning:** Sequential network requests in a loop (O(N)) and nested linear searches (O(N*M)) in API routes create significant latency and scalability bottlenecks.
**Action:** Always use Map-based lookups for O(1) retrieval and parallelize independent network requests using `Promise.allSettled` to reduce latency to O(max(latency)).
