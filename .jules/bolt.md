## 2026-05-29 - [Optimized Reports API]
**Learning:** Sequential network requests in API routes significantly increase latency. Lexicographical string comparison for ISO 8601 timestamps is a highly efficient alternative to 'Date' object instantiation in loops.
**Action:** Always parallelize independent notifications and prefer string comparisons for standardized date formats.
