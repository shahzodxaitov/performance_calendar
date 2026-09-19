## 2025-05-18 - CRM Dashboard Parallel Data Fetching & Memory Guarding
**Learning:** Sequential `.then()` API requests in React `useEffect` hooks create network waterfalls (cumulative latency) and risk state updates on unmounted components when swapping filter options.
**Action:** Parallelize independent network requests using `Promise.allSettled` and guard state setters with an `isMounted` flag inside `useEffect` cleanup routines.
