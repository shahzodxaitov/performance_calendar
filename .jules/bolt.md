## 2025-05-14 - [Environment Dependency Regression]
**Learning:** Running `npm install` or `npm run build` in this environment can result in an unexpected downgrade of critical packages (specifically `next` from 15.1.0 to 15.0.0) in `package-lock.json`, which introduces security vulnerabilities.
**Action:** Always verify and revert dependency downgrades using `git restore package-lock.json` if they occur after running build or install commands.

## 2025-05-14 - [O(N*M) to O(N+M) with Map]
**Learning:** Replacing linear searches (`Array.prototype.find`) inside loops with a `Map` lookup reduces algorithmic complexity from O(N * M) to O(N + M), which is a critical pattern for scaling batch operations like reminder checks.
**Action:** Proactively look for nested loops or repeated find calls and replace with Map/Set lookups.

## 2025-05-14 - [Parallelizing Network Requests]
**Learning:** Parallelizing independent network requests using `Promise.all` in batch operations is a critical optimization to reduce total execution time from the sum of sequential latencies to the maximum single latency.
**Action:** Use `Promise.all` or `Promise.allSettled` for batch network tasks (like Telegram notifications).
