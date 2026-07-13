## 2025-07-13 - O(N+M) Map Lookups and Parallel I/O in Batch Processes
**Learning:** Batch processing routes that perform linear searches (O(N*M)) and sequential network requests (O(N)) create significant latency bottlenecks as data scales.
**Action:** Use `Map` for constant-time lookups and `Promise.allSettled` to parallelize independent I/O operations, reducing latency to O(1) relative to batch size.

## 2025-07-13 - Environment Side Effects during Build
**Learning:** Running `next build` (v15) may automatically reconfigure `tsconfig.json` (e.g., setting `jsx: preserve`), which can lead to unintended staged changes.
**Action:** Always verify `git status` after builds and use `git restore` to revert mandatory environment reconfigurations that aren't part of the task scope.
