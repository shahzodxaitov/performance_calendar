## 2025-05-14 - Optimized ISO Date Comparisons
**Learning:** In performance-critical code involving ISO 8601 timestamps, direct lexicographical string comparison is significantly faster than 'Date' object instantiation. Specifically, `a.created_at < b.created_at` or `a.created_at.localeCompare(b.created_at)` avoids the overhead of heap allocations and CPU cycles required for `new Date()` parsing.
**Action:** Use direct string comparisons for ISO 8601 dates when filtering or sorting large datasets.

## 2025-05-14 - Map Lookups vs Array.find
**Learning:** Replacing `Array.prototype.find` inside a loop with a `Map` lookup reduces algorithmic complexity from O(N * M) to O(N + M). This is particularly impactful when matching tasks to team members or other relational data in API routes.
**Action:** Pre-calculate a `Map` for lookups before entering a loop over a large collection.
