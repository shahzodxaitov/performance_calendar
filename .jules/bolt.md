## 2025-05-15 - [AmoCRM Stats Processing Optimization]
**Learning:** Reusing `Date` objects with `.setTime()` inside processing loops and hoisting static lookup arrays/Sets significantly reduces heap allocations and garbage collection pressure in Next.js API routes.
**Action:** Always check for redundant object instantiations in loops and use `request.nextUrl.searchParams` instead of `new URL(request.url)` for more efficient parameter access.
