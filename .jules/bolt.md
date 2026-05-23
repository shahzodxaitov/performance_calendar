## 2025-05-14 - Map-based lookup and parallelization in batch reminder checks

**Learning:** Replacing $O(N \times M)$ nested lookups with a $O(N + M)$ `Map` significantly reduces CPU time for batch processing. Parallelizing I/O-bound Telegram notifications with `Promise.allSettled` transforms the execution time from $\sum latency$ to $\max(latency)$, drastically improving throughput. Using `Date.parse()` and caching `now.getTime()` avoids repeated object instantiation overhead in large loops.

**Action:** Always prefer `Map` for cross-entity lookups in loops and parallelize network requests in batch API routes. Use numeric timestamps for high-frequency comparisons.
