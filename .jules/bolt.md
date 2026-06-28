## 2025-05-14 - Parallelized Notifications and Optimized Lookups in check-reminders

**Learning:** Batch processing routes that involve external API calls (like Telegram) and data lookups often suffer from O(N*M) complexity and sequential network bottlenecks. Parallelizing notifications with `Promise.allSettled` and using `Map` for lookups significantly improves performance and reliability.

**Action:** Always check for sequential `await` inside loops when dealing with network requests and replace O(N) array searches with O(1) Map lookups in batch jobs.
