## 2025-07-10 - Optimizing Batch Task Reminders

**Learning:** Batch notification routes in this architecture suffer from serial network I/O and nested O(N*M) lookups. Parallelizing with `Promise.allSettled` reduces execution time from linear to constant relative to the number of tasks (bounded by the slowest request). Using a `Map` for team member lookups prevents quadratic complexity as the team grows.

**Action:** Always check for serial `await` within loops in API routes, especially for external service calls like Telegram. Prefer `Map` over `.find()` for ID-based lookups in batch processing.
