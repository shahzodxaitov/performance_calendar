## 2025-05-14 - Batch Notification Optimization
**Learning:** Sequential await in loops for network requests (like Telegram API) creates a bottleneck proportional to the number of items. Parallelizing with Promise.allSettled and using a Map for O(1) lookups significantly improves performance.
**Action:** Always use Promise.allSettled for independent external API calls and prefer Maps over .find() in loops.
