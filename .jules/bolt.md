## 2025-05-22 - [Optimizing amoCRM Stats API]
**Learning:** Hoisting static data structures (like day/month names) and using bitwise operations (`hour & ~1`) for bucketing inside high-frequency loops (like processing 250+ leads) avoids unnecessary allocations and CPU cycles. Additionally, `request.nextUrl.searchParams` is a faster alternative to `new URL(request.url)` in Next.js Edge/Serverless environments.
**Action:** Always check for opportunities to hoist static definitions and reuse `Date` objects when processing batches of time-series data.
