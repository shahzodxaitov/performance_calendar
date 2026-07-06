## 2025-05-14 - [check-reminders] Parallel Notifications and O(1) Lookups
**Learning:** Sequential await in batch jobs with network requests (Telegram API) causes total latency to be O(N), where N is the number of tasks. Additionally, linear searches for team members inside the task loop resulted in O(N*M) complexity.
**Action:** Use `Promise.allSettled` to parallelize network IO and implement a `Map` for O(1) assignee lookups. Ensure task status flags are only updated upon confirmed notification success to maintain state integrity.
