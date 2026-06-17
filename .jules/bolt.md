## 2025-05-15 - Optimize Task Reminders Batch Processing

**Learning:** Batch processing routes like `check-reminders` often suffer from O(N*M) complexity when joining related data (tasks and team members) using simple array searches. Sequential `await` in loops also significantly increases total latency, especially with external API calls (Telegram).

**Action:**
1. Use `Map` for O(N+M) lookups instead of O(N*M).
2. Parallelize network requests using `Promise.allSettled`.
3. Cache reference timestamps to avoid repeated `new Date()` calls and ensure consistency.
4. Return success indicators from helpers to safely update state only on success.

### Baseline (Pre-optimization)
- **File:** `src/app/api/tasks/check-reminders/route.ts`
- **Complexity:** O(N * M) where N is number of tasks and M is number of team members.
- **Network:** Sequential (one-by-one). Total time = sum of all latencies.
- **Consistency:** `new Date()` called at start, but long-running loop might drift.
