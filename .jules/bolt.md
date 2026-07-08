# Bolt's Performance Journal ⚡

## 2025-05-15 - Baseline
**Learning:** Initializing the performance journal to track optimizations in the kalendar project.
**Action:** Always document optimizations here following Bolt's philosophy.

## 2025-05-15 - Optimize Task Reminder Batch Processing
**Learning:** The `check-reminders` route was performing O(N*M) lookups and sequential network requests for notifications, which scales poorly as the number of tasks and team members grows.
**Action:**
1. Replaced linear search for team members with a `Map` lookup (reducing complexity from O(N*M) to O(N+M)).
2. Parallelized Telegram notifications using `Promise.allSettled`, reducing total execution time to the maximum single request latency.
3. Optimized date calculations by reusing a numeric timestamp (`nowMs`) and using `Date.parse()` instead of repeated `new Date()` instantiations.
4. Ensured task notification flags are only updated upon successful notification delivery to maintain state integrity.
**Impact:** Significantly reduced response time for the reminder check endpoint, especially as task volume increases.
