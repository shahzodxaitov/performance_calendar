## 2025-05-14 - Map-based lookup and Parallelization in Batch Jobs
**Learning:** Sequential network requests and O(N*M) nested lookups in API routes like `check-reminders` cause significant latency as data scales. Parallelizing with `Promise.all` and using `Map` for lookups provides immediate, measurable gains.
**Action:** Always prefer `Map` for cross-referencing collections and `Promise.all` for independent external API calls in batch processes.
