## 2025-07-11 - Optimizing Task Reminders

**Learning:** The `check-reminders` route performs O(N*M) lookups (tasks * team members) and sends Telegram notifications sequentially, which scales poorly as the number of tasks and team members grows.

**Action:**
1. Implement O(N+M) Map-based lookup for team members.
2. Parallelize network requests using `Promise.allSettled`.
3. Hoist reference timestamp to ensure consistency.
4. Only update task flags if the notification actually succeeds.

**Baseline Metrics:**
- Algorithmic Complexity: O(N * M) for lookups.
- Network Latency: O(T) where T is the number of notifications sent (sequential).
- Consistency: `new Date()` called in each loop iteration.
