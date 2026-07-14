## 2025-05-14 - Optimized Task Reminders API

**Learning:** The `check-reminders` route suffered from O(N*M) complexity due to nested team lookups and O(N * Latency) execution time due to sequential Telegram notifications. Parallelizing network requests is critical for batch processes in serverless environments to avoid timeouts.

**Action:**
1. Replace `team.find` with a `Map` for O(1) lookups (reducing complexity to O(N+M)).
2. Use `Promise.allSettled` to parallelize Telegram notifications.
3. Cache a baseline timestamp (`nowMs`) to ensure consistent time comparison across all tasks.
4. Only update task flags if the notification promise is fulfilled.
