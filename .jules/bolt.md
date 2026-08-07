# Bolt's Performance Journal

## 2025-08-07 - Optimizing Task Reminders and Telegram Dispatching
**Learning:** Sequential await loops over remote API requests (like Telegram bot notifications) block the main serverless thread and exponentially degrade response times as the dataset scales. Replacing $O(N \cdot M)$ array lookups with an $O(N + M)$ Map lookup for relational connections (such as finding task assignees) completely resolves CPU-bound overhead.
**Action:** Always map-hoist relational arrays before nested processing loops, cache static or current temporal reference baselines (`Date.now()` or `nowMs`) outside loops, and dispatch parallelized network actions using `Promise.allSettled` to avoid blocking the main event thread, while validating promise status results before mutating storage flags.
