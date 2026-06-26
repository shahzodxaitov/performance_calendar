# Bolt's Performance Journal

## 2025-05-15 - Optimizing Task Reminders
**Learning:** Serial `await` in loops for network requests (Telegram API) causes execution time to scale linearly with the number of tasks, potentially hitting timeouts. O(N*M) lookups for team members also add unnecessary overhead.
**Action:** Use `Promise.allSettled` for parallel notifications and a `Map` for O(1) member lookups.
