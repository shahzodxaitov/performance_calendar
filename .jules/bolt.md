## 2025-05-18 - Client Portal & Client API Route Optimization

**Learning:** In polling client components that fetch data on an interval, calling `setLoading(true)` on background refreshes unmounts the dashboard view and causes full-screen spinner flicker. In API routes with heavy date-based lead/task processing, using `Date.parse()` primitive comparisons and reusing a single `Date` instance with `.setTime()` eliminates heap allocations during request handling.

**Action:** Perform background polling updates silently without toggling full-page loading states, and use `Date.parse()` primitive timestamps for O(1) filtering and sorting in Next.js API routes.
