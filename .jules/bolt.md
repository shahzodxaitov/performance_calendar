# Bolt's Performance Journal ⚡

## 2025-05-14 - Sequential Network Latency in Batch Operations
**Learning:** The `check-reminders` route was executing Telegram notifications sequentially within a loop. In a batch process, network latency accumulates linearly, which can lead to timeouts or extremely slow response times as the number of tasks grows.
**Action:** Always parallelize independent network requests using `Promise.allSettled` in batch jobs to bound the total latency to the slowest single request.

## 2025-05-14 - Map vs. Array Search Complexity
**Learning:** Using `Array.prototype.find` inside a loop over another large array creates $O(N \times M)$ complexity.
**Action:** Convert the lookup array to a `Map` before entering the loop to achieve $O(N + M)$ complexity, ensuring the system scales efficiently with data volume.
