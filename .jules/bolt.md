# ⚡ Bolt's Performance Journal

## 2025-05-15 - Batch Processing Optimization in Reminder System
**Learning:** Sequential network requests in loops (e.g., sending Telegram notifications) are a major bottleneck. Parallelizing them with `Promise.allSettled` reduces total latency from $O(\sum \text{latency})$ to $O(\max \text{latency})$. Additionally, replacing $O(N \cdot M)$ lookups with $O(N + M)$ Map-based lookups is critical as the dataset grows.
**Action:** Always check for sequential `await` calls in loops and look for opportunities to use `Map` for cross-entity lookups.

## 2025-05-15 - Environment Management
**Learning:** Running `npm install` or `npm run build` in this environment may unexpectedly downgrade `next` in `package-lock.json` (from 15.1.0 to 15.0.0), introducing security vulnerabilities.
**Action:** Always verify `package-lock.json` after running install/build scripts and revert unauthorized downgrades using `git restore`.
