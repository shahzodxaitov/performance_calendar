# Bolt's Performance Journal

This journal tracks critical performance-related learnings.

## 2026-04-13 - [Parallelized Telegram Notifications & O(1) Lookups in Reminder Checking]
**Learning:** Sequential network requests in loops (e.g. fetching API endpoints) scale linearly O(N), blocking the main thread/serverless route execution. Parallelizing notifications via `Promise.allSettled` while executing O(1) Map-based member lookups instead of nested O(N*M) array iterations dramatically improves throughput.
**Action:** Always map array lookups to constant-time `Map` accesses beforehand and bundle multiple asynchronous notifications using `Promise.allSettled`.
