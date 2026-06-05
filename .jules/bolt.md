## 2025-05-15 - Optimizing Batch Reminder Jobs
**Learning:** Batch operations like `check-reminders` often suffer from O(N*M) complexity when lookups are done via `.find()` inside loops. Sequential network requests further bottleneck performance.
**Action:** Always use a `Map` for lookups to achieve O(N+M) complexity and parallelize independent network requests using `Promise.allSettled`. Ensure helper functions return success indicators to maintain state integrity during parallel execution.
