## 2026-05-27 - Optimize Batch Process for Reminders

**Learning:** Combining Map-based lookups O(N+M) with parallelized network requests (Promise.allSettled) drastically improves batch API route performance, especially when dealing with external API latencies like Telegram.
**Action:** Always look for O(N*M) array searches inside loops and use Maps for O(1) lookups. Parallelize independent network requests in batch jobs.

## 2026-05-27 - Environment Sensitivity

**Learning:** Running 'npm install' or 'npm run build' can trigger automatic downgrades of packages (e.g., Next.js 15.1.0 to 15.0.0) and unauthorized changes to 'tsconfig.json' (jsx: preserve).
**Action:** Always verify 'git status' after running build/install commands and use 'git restore' to revert unauthorized changes.
