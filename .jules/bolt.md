## 2025-05-15 - [Initial Profiling]
**Learning:** The `check-reminders` API route performs O(N*M) lookups for team members and sends Telegram notifications sequentially, leading to linear latency growth with the number of tasks.
**Action:** Implement O(N+M) Map lookup and parallelize notifications using `Promise.allSettled`.
