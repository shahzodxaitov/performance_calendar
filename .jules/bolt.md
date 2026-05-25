# Bolt's Performance Journal

## 2025-05-15 - [Configuration Regressions]
**Learning:** Running `npm install` or `next build` in this environment can automatically modify `tsconfig.json` (e.g., changing `jsx` to `preserve`) and `package-lock.json`. These changes are often unauthorized and violate project boundaries.
**Action:** Always verify `git status` after running install or build commands and revert unauthorized changes to configuration files using `git restore`.

## 2025-05-15 - [Batch Processing Optimization]
**Learning:** Sequential `await` in loops for I/O operations (like Telegram notifications) is a major bottleneck. Replacing it with `Promise.allSettled` significantly reduces execution time. Linear search inside loops is also a common anti-pattern that can be solved with `Map`.
**Action:** Use `Map` for lookups and `Promise.allSettled` for batch I/O in API routes.
