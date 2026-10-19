## 2026-03-24 - Parallelize API Notifications & Pre-built Maps
**Learning:** In cron/reminder routes iterating over tasks, sequential `await` network calls (e.g. sending Telegram notifications) create blocking network bottlenecks, while array `find` lookups create $O(N \times M)$ overhead. Batching requests with `Promise.allSettled()` and pre-building lookup Maps reduces response latency significantly.
**Action:** Use `Promise.allSettled()` for concurrent outbound notification requests and pre-build `Map` lookups for array searches in loop bodies.
