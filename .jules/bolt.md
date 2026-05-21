## 2025-05-15 - [Optimized Batch Reminders]
**Learning:** Sequential await calls in a loop for network requests (Telegram notifications) create a significant latency bottleneck that scales linearly with the number of tasks. Implementing a Map for member lookups reduced complexity from O(N*M) to O(N+M).
**Action:** Always parallelize independent network requests using `Promise.allSettled` and use Maps for frequent lookups in loops to maintain O(N) performance.
