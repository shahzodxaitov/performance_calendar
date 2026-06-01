## 2025-05-12 - Parallelizing Batch Notifications

**Learning:** Sequential `await` in loops for network requests (like Telegram API) is a major performance bottleneck, especially as the number of tasks grows.
**Action:** Use `Promise.allSettled` to parallelize independent network requests and use `Map` for O(N+M) lookups instead of O(N*M) `.find()` in loops.
