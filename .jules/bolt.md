## 2025-05-14 - Batch Notification Optimization

**Learning:** Batch processing routes like `check-reminders` often suffer from two major bottlenecks: $O(N \times M)$ algorithmic complexity due to nested lookups (e.g., finding team members for each task) and sequential I/O latency when sending notifications.

**Action:**
1. Use a `Map` to perform lookups in $O(1)$ time within loops, reducing overall complexity to $O(N + M)$.
2. Parallelize network requests using `Promise.allSettled` to reduce total execution time to the latency of the slowest request.
3. Ensure state-modifying flags (e.g., `notified_1day`) are only updated upon confirmed success of the external operation.
