# Bolt's Journal

## 2026-03-25 - Task Reminder Check Route Optimizations
**Learning:** `src/app/api/tasks/check-reminders/route.ts` executed sequential network requests (`await`) in a loop and performed linear array scans (`team.find`) on every task.
**Action:** Always map lookups before loops, use primitive `Date.parse()` timestamps, and collect async notification promises to execute concurrently via `Promise.allSettled()`.
