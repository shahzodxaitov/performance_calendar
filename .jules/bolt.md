## 2025-05-15 - [Batch Notification Optimization]
**Learning:** Batch operations involving network requests and nested lookups are the primary performance bottlenecks in this architecture. Serializing requests in a loop leads to linear accumulation of latency (O(N * latency)), and array searches inside loops lead to O(N * M) complexity.
**Action:** Always use a Map for O(1) lookups when joining datasets in memory and use `Promise.allSettled` to parallelize I/O operations in batch jobs.

## 2025-05-15 - [Environment Side Effects]
**Learning:** Running `npm install` or `next build` in this environment triggers unauthorized changes to `package-lock.json` and `tsconfig.json` (e.g., setting `jsx: preserve`).
**Action:** Always run `git restore --staged` and `git restore` on these files immediately after build/install commands to maintain persona boundaries.
