## 2025-05-18 - Optimized DELETE handlers in companies and team API endpoints
**Learning:** Next.js `NextRequest` objects already contain pre-parsed URL search parameters under `request.nextUrl.searchParams`. Creating a `new URL(request.url)` on every incoming API request causes redundant URL string parsing and object allocation overhead.
**Action:** Always prefer `request.nextUrl.searchParams` over `new URL(request.url)` across Next.js API route handlers.
