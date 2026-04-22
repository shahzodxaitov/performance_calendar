## 2025-05-24 - Optimizing Batch Lookups and Filtering

**Learning:** Replacing linear searches (`Array.prototype.find`) inside loops with a `Map` lookup reduces algorithmic complexity from O(N * M) to O(N + M). This is critical for batch processes like reminder checks where both datasets can grow. Additionally, hoisting string transformations (like `toLowerCase()`) out of high-frequency loops (like `Array.prototype.filter`) prevents redundant O(N) work.

**Action:** Always check for nested loops where the inner loop is a simple lookup, and use a Map or Set instead. Hoist constants and pre-calculated values outside of iteration blocks.
