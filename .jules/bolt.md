## 2025-05-22 - Parallelizing Batch Operations

**Learning:** When dealing with batch operations that involve external API calls (like Telegram notifications), sequential `await` calls create a major performance bottleneck due to cumulative network latency.

**Action:** Use `Promise.all` or `Promise.allSettled` to parallelize independent network requests. Always return a success indicator from the request helper to ensure state updates (like notification flags) are only applied for successful operations.

## 2025-05-22 - Algorithmic Optimization for Lookups

**Learning:** Nested loops ($O(N \times M)$) for looking up related entities (e.g., finding a team member for each task) scale poorly as data grows.

**Action:** Convert the lookup array into a `Map` before the loop. This reduces the complexity to $O(N + M)$, providing a measurable speedup even for moderate dataset sizes.
