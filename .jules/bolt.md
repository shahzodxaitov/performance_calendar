## 2025-05-14 - Optimized Reports API Performance

**Learning:** Direct lexicographical string comparison for ISO 8601 timestamps is significantly faster (~30x) than instantiating `Date` objects for sorting and filtering. Additionally, using `request.nextUrl` in Next.js API routes avoids redundant URL parsing overhead.

**Action:** Always prefer `request.nextUrl` over `new URL(request.url)` and use string-based comparisons for ISO dates in performance-critical paths like loops and sorts. Parallelize independent network calls (e.g., Telegram notifications) using `Promise.allSettled` to minimize total request latency.
