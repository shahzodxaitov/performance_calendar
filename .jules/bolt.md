## 2025-05-22 - [Optimized Leads API with String Comparison]
**Learning:** Using lexicographical string comparison for ISO 8601 timestamps is significantly faster than instantiating `Date` objects, especially when filtering or sorting large datasets. Additionally, `request.nextUrl.searchParams` is more efficient than `new URL(request.url)` in Next.js API routes.
**Action:** Always prefer string comparisons for ISO dates and use `request.nextUrl` for query parameters in performance-critical API routes.
