## 2025-05-14 - Batch Reminder Optimization
**Learning:** Sequential await calls in batch network operations (like sending Telegram notifications) create a significant latency bottleneck that scales linearly with the number of items. Algorithmic complexity in data lookups (O(N*M)) further degrades performance as the dataset grows.
**Action:** Always parallelize network requests in batch jobs using `Promise.allSettled` and use Maps for O(1) lookups instead of nested loops. Ensure state updates are atomic and only occur on verified success.
