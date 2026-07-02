## 2026-07-02 - Optimize check-reminders notifications

**Learning:** The current implementation of `src/app/api/tasks/check-reminders/route.ts` processes reminders sequentially and uses linear search for team members, leading to O(N*M) complexity and high latency due to blocking network calls.

**Action:**
1. Use a `Map` for team members to achieve O(N+M) complexity.
2. Parallelize Telegram notifications using `Promise.allSettled` to reduce execution time from sum of latencies to max latency.
3. Cache the baseline timestamp (`nowMs`) to avoid redundant `new Date()` and `getTime()` calls inside the loop.
4. Update task notification flags only if the notification was successfully sent.
