## 2025-05-15 - [ISO 8601 String Comparison vs Date Objects]
**Learning:** For performance-critical code involving ISO 8601 timestamps (e.g., sorting or filtering large lists), direct lexicographical string comparison is significantly faster (~30x in benchmarks) than `Date` object instantiation and `.getTime()` calls.
**Action:** Prefer `b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0` over `new Date(b.created_at).getTime() - new Date(a.created_at).getTime()` for sorting ISO 8601 strings.
