# Bolt's Performance Journal

This journal documents critical learnings about performance optimizations in this codebase.

## 2026-04-13 - Initial Baseline
**Learning:** Pre-commit checks strictly enforce linting and Next.js builds. Common bottlenecks in this repository revolve around synchronous I/O, linear searches in loops (O(N*M)), unmemoized React components/lookups, and sequential external network requests (like Telegram API calls).
**Action:** Always identify single targeted bottlenecks, profile algorithmic and I/O efficiency, verify changes with local lint and builds, and avoid regressions.
