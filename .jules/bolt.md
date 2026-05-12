## 2025-05-15 - Optimizing Task Reminders

**Learning:** Sequential network requests in batch processing (like sending Telegram notifications in a loop) create a massive latency bottleneck. Parallelizing with `Promise.allSettled` while maintaining state integrity (only marking as "notified" if the request succeeds) is critical. Additionally, replacing $O(N \times M)$ linear searches with $O(N + M)$ Map lookups significantly reduces CPU overhead for large datasets.

**Action:** Always parallelize independent I/O tasks in batch routes and prefer Map/Set for lookups inside loops.
