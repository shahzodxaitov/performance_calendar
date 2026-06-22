## 2025-05-14 - Batch Notification Optimization

**Learning:** Batch jobs that iterate over N items and perform M lookups (like finding an assignee for a task) can easily hit O(N*M) complexity. Parallelizing external API calls (Telegram) significantly reduces latency from cumulative O(N) to roughly the max latency of a single request.

**Action:** Use `Map` for O(1) lookups within loops. Parallelize independent network requests using `Promise.allSettled`. Ensure state updates (flags) are conditional on request success to maintain data integrity.
