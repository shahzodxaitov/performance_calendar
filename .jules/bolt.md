## 2025-05-14 - Optimizing Batch Notification Processing

**Learning:** Sequential `await` in loops for network requests is a major latency bottleneck. Using `Promise.allSettled` with helper functions that return success booleans allows for high-concurrency processing without losing state integrity. Additionally, replacing nested $O(N)$ searches with $O(1)$ Map lookups is a low-effort, high-impact algorithmic win.

**Action:** Always look for sequential network requests in batch jobs and parallelize them. Use `Map` for cross-referencing datasets instead of `Array.prototype.find`.
