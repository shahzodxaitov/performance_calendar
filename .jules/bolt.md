## 2025-05-22 - Parallelizing Batch Notifications

**Learning:** Batch operations that involve sequential network requests (e.g., Telegram notifications in a loop) are a major bottleneck. Parallelizing them with `Promise.allSettled` reduces total execution time from O(N * latency) to O(max(latency)). Additionally, using a `Map` for lookups inside loops avoids O(N^2) complexity.

**Action:** Always check for `await` calls inside loops and consider `Promise.all` or `Promise.allSettled`. Use `Map` for frequent lookups of static data.

## 2025-05-22 - Environment Protection

**Learning:** Running `npm install` or `npm build` in some environments can automatically modify `package-lock.json` or `tsconfig.json` (e.g., changing `jsx` to `preserve`). This can introduce security vulnerabilities (like downgrading `next`) or break builds.

**Action:** Always verify `git status` after running build/install commands and restore any unauthorized changes to configuration files immediately.
