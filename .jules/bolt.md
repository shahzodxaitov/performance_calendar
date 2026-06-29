## 2025-05-22 - Batch Notification Optimization in check-reminders
**Learning:** Batch jobs that perform sequential network requests (e.g., Telegram notifications) in a loop suffer from O(N * L) latency where L is the network latency. Parallelizing these requests with `Promise.allSettled` and replacing O(N*M) linear lookups with O(N+M) Map lookups significantly improves execution time.
**Action:** Use `Map` for cross-entity lookups in loops and `Promise.allSettled` for independent I/O operations.
