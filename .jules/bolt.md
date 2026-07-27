## 2025-07-27 - Batch Processing Optimization in Telegram Reminders API

**Learning:** Batch Processing in Webhook or CRON loops with nested searches $O(N \times M)$ and sequential network IO `await fetch` creates heavy execution blocking, especially on serverless environments where timeouts and connection limits are restrictive.

**Action:**
1. Map-lookup hoisting: Transition all $O(N \times M)$ nested arrays searches to $O(N + M)$ by instantiating a Map out of the static array before iterating.
2. Async parallelization: Use `Promise.allSettled()` to process all outgoing asynchronous network IO requests concurrently.
3. Heap allocation reduction: Reuse a single `Date` object instance with `setTime` or native `Date.parse()` calls within the loop instead of generating dynamic multiple date object allocations inside loop scopes.
4. Correctness of state updates: Only mark the database task status flags (such as `notified_1day`, `notified_1hour`) as successfully processed if their respective network dispatch promise actually resolves with success.
