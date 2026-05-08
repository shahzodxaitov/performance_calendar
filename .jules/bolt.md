## 2025-05-14 - [Batch Notification Optimization]
**Learning:** Sequential `await` calls in a loop for network requests create a significant bottleneck, especially when scaling. Parallelizing these with `Promise.allSettled` drastically reduces total execution time.
**Action:** Always check for opportunities to parallelize independent side effects in batch processing routes.

## 2025-05-14 - [Lookup Complexity]
**Learning:** Linear searches (`Array.prototype.find`) inside loops lead to O(N*M) complexity.
**Action:** Use a `Map` for O(1) lookups in performance-critical loops to achieve O(N+M) complexity.
