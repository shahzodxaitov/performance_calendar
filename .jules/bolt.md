# Bolt Journal - Critical Learnings Only

## 2025-05-10 - AmoCRM Stats API Endpoint Optimization
**Learning:** In Next.js route handlers processing financial/lead telemetry, repeated `new URL(request.url)` parsing, recreating static arrays inside `forEach` loops, recreating `Set`/`Array` lookups per element, and creating `new Date()` instances inside loops cause unnecessary heap allocations and GC pressure.
**Action:** Use `request.nextUrl.searchParams`, hoist static lookup arrays/Sets outside route handler or iteration loops, and mutate a single reused `Date` instance with `.setTime(timestamp)` when processing epoch seconds.
