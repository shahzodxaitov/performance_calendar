## 2025-05-15 - Optimizing Leads API Route
**Learning:** Replacing `new URL(request.url)` with `request.nextUrl.searchParams` and using lexicographical string comparison for ISO 8601 timestamps avoids thousands of unnecessary object instantiations in list-heavy API routes.
**Action:** Always prefer `request.nextUrl` and string-based date comparisons for performance-critical path in Next.js API handlers.
