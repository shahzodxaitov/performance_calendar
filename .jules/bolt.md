## 2025-05-15 - Task Reminders Optimization

**Baseline Analysis:**
- **Complexity:** O(N*M) for team member lookups due to `.find()` inside the task loop.
- **Network:** Sequential `await` on Telegram API calls results in high total latency (O(N) * latency).
- **State Integrity:** Task notification flags are updated before confirming successful delivery.
- **Redundancy:** Multiple `new Date()` instantiations for now and deadlines.

**Action:**
- Implement `Map` for O(N+M) lookup.
- Use `Promise.allSettled` for parallel notification dispatch.
- Refactor helper to return success status for atomic state updates.
