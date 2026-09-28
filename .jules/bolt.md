# Bolt Performance Journal

## 2026-03-24 - ISO 8601 String Comparison vs Date Heap Allocations in API Endpoints
**Learning:** Instantiating `new Date(str).getTime()` inside `Array.prototype.filter()` and `Array.prototype.sort()` loops allocates O(N) and O(N log N) Date objects per request, pressuring GC. Using `Date.parse(str)` or direct string comparison for standard ISO 8601 dates eliminates heap allocations completely.
**Action:** Replace `new Date(...)` parsing inside request processing loops with primitive `Date.parse()` or direct string operations, and use `request.nextUrl.searchParams` instead of `new URL(request.url)`.
