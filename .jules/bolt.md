## 2026-03-24 - Native Request SearchParams Parsing
**Learning:** In Next.js API routes (`NextRequest`), `request.nextUrl.searchParams` is pre-parsed and cached. Calling `new URL(request.url)` causes redundant URL instantiation and full string re-parsing overhead on every incoming HTTP request.
**Action:** Always prefer `request.nextUrl.searchParams` over `new URL(request.url)` in Next.js App Router route handlers.
