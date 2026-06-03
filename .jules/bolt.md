## 2025-05-14 - Map-based lookups and Parallel I/O in Batch Jobs
**Learning:** Replacing O(N*M) nested loops with O(N+M) Map-based lookups significantly improves performance in batch processing routes. Additionally, parallelizing sequential network requests using `Promise.allSettled` reduces total latency from $O(N \times \text{latency})$ to $O(\text{latency})$.
**Action:** Always check for nested `find` or `filter` operations in loops and replace with `Map` or `Set`. Parallelize independent network requests in batch operations.
