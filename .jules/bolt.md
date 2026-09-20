## 2025-05-18 - Avoid URL Constructor Overhead in Route Handlers
**Learning:** Next.js `NextRequest` objects already contain pre-parsed `request.nextUrl.searchParams`. Using `new URL(request.url)` instantiates a redundant `URL` object on every API request.
**Action:** Use `request.nextUrl.searchParams` directly in Next.js API route handlers.
