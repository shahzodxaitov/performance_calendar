# Bolt's Journal - Performance Learnings

## 2024-05-15 - ISO 8601 String Comparison vs Date Objects
**Learning:** For ISO 8601 formatted date strings (e.g., "2024-05-15T12:00:00.000Z"), direct lexicographical string comparison is significantly faster than parsing them into `Date` objects. My benchmarks showed that string comparison was ~17x faster than `new Date(b).getTime() - new Date(a).getTime()`.
**Action:** Always prefer direct string comparison for sorting and filtering collections by date when the dates are already in ISO 8601 format. This avoids unnecessary object allocations and parsing overhead in hot paths like API routes.
