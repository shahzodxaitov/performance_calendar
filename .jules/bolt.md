## 2025-05-15 - Optimized Task Reminder Batch Processing

**Learning:** The `check-reminders` route had several performance bottlenecks:
1. O(N*M) lookup complexity for team members inside the task loop.
2. Sequential `await` for Telegram notifications, leading to high latency for large task lists.
3. Multiple `new Date()` instantiations within the loop.
4. Unconditional state updates even if notification fails.

**Action:**
- Implement a `Map` for team member lookups (O(N+M)).
- Parallelize notifications using `Promise.allSettled`.
- Use a single `nowMs` baseline for comparisons.
- Only update notification flags on successful delivery.
