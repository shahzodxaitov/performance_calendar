# ⚡ Bolt's Performance Journal

## 2026-06-25 - Lexicographical Comparison of ISO 8601 Strings for Filtering and Sorting
**Learning:** Instantiating `new Date()` objects inside filtering loops and sorting comparators is a major performance bottleneck, introducing substantial memory allocation and GC pressure. For ISO 8601 formatted strings (e.g. `2026-06-25T18:51:55.000Z`), the chronological order strictly matches alphabetical (lexicographical) order. Direct string comparison operators (`<`, `>`, `===`) are up to 30x-50x faster than creating and comparing Date objects because they execute natively without object allocations.
**Action:** Always pre-compute date boundaries as ISO 8601 strings outside loops or sorting functions, and use native lexicographical string comparison for filtering and sorting collections of ISO 8601 timestamps.
