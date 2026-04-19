## 2025-05-14 - Map Lookup for Batch Operations
**Learning:** Replacing `Array.find` with a `Map` lookup inside a loop reduces algorithmic complexity from O(N * M) to O(N + M). This is particularly impactful for batch operations like processing tasks with assignee lookups.
**Action:** Always prefer pre-indexing data into a `Map` when performing lookups inside a loop.
