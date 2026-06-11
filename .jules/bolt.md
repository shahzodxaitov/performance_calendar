## 2025-05-14 - Optimize Task Reminder Batch Processing

**Learning:** Batch processing routes like `check-reminders` suffer from O(N*M) complexity when lookups (e.g., team members) are performed inside loops, and from high latency when network requests (e.g., Telegram notifications) are executed sequentially.

**Baseline Performance:**
- Algorithmic Complexity: O(N*M) where N is the number of tasks and M is the number of team members.
- Execution Model: Sequential await for each notification (O(N * latency)).
- State Integrity: Task flags are updated regardless of notification success.

**Optimization Plan:**
1. Replace `team.find` with an O(N+M) `Map` lookup.
2. Cache `now.getTime()` as `nowMs` to avoid redundant instantiations/calls inside the loop.
3. Parallelize notifications using `Promise.allSettled` to reduce total execution time to ~O(max(latency)).
4. Refactor notification helper to return `Promise<boolean>` and only update state flags on success.

**Action:** Apply these patterns to `src/app/api/tasks/check-reminders/route.ts`.
