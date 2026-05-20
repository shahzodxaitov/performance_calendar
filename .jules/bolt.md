## 2025-05-22 - ISO 8601 String Comparison vs Date Objects

**Learning:** Direct lexicographical comparison of ISO 8601 strings (`a.created_at < b.created_at`) is significantly faster (~20-30x) than instantiating `Date` objects and using `.getTime()` for filtering and sorting in loops. Next.js `request.nextUrl.searchParams` is also preferred over `new URL(request.url)` for performance.

**Action:** Prefer string comparisons for timestamps in performance-critical paths (filtering/sorting large arrays). Use `request.nextUrl.searchParams` in Next.js API routes.
