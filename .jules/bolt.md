# Bolt Performance Journal ⚡

## 2025-05-22 - Optimizing Batch Notification Latency and Complexity
**Learning:** In batch processing routes (like reminder checks), nested linear searches lead to $O(N \times M)$ complexity. Additionally, sequential network requests for notifications create a total latency of $N \times \text{latency}$.
**Action:** Always use a `Map` for lookups to achieve $O(N + M)$ complexity and parallelize independent network requests using `Promise.allSettled` to reduce total latency to $\max(\text{latency})$.
