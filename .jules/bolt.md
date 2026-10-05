# Bolt's Journal - Critical Performance Learnings

## 2025-05-18 - Avoid redundant `new URL()` allocations in NextRequest handlers
**Learning:** Next.js `NextRequest` objects already pre-parse query parameters into `request.nextUrl.searchParams`. Creating a `new URL(request.url)` in API route handlers adds unnecessary string parsing and object allocation overhead per request.
**Action:** Use `request.nextUrl.searchParams` directly in Next.js App Router API route handlers instead of constructing `new URL(request.url)`.
