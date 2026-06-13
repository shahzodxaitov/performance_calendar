## 2026-06-13 - Optimize task reminder notifications
**Learning:** Batch processing routes often suffer from O(N*M) lookup complexity and sequential network latency. Using a Map for O(1) lookups and parallelizing independent network requests with `Promise.allSettled` drastically improves performance.
**Action:** Always prefer Map lookups over Array.find in loops and use parallel execution for independent side effects like notifications.
