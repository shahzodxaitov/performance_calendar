## 2026-04-13 - Optimize Reminder Notifications Dispatching

**Learning:**
In high-throughput cron/reminder endpoints like `check-reminders`, performing sequential async await requests (O(N) HTTP calls) blocks the main thread, leading to severe latency bottlenecks. Additionally, querying the assignee on each iteration with an O(N) array search results in O(Tasks * Team) time complexity.

**Action:**
1. Build an O(1) Map lookup (`teamMap`) from the `team` array to fetch user profiles in O(1) time.
2. Store the current baseline timestamp (`nowMs`) to avoid repeatedly calling `new Date().getTime()` across hundreds of items.
3. Parallelize outbound Telegram notifications with `Promise.allSettled`, which dramatically reduces API dispatch latency from O(N) to O(1) concurrent request windows.
4. Ensure task notification flags are only flipped to `true` if the Telegram fetch call resolves successfully (fulfilled + successful status), preserving retry consistency for failed notifications.
