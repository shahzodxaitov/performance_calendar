## 2026-06-30 - Optimizing Task Reminders Processing
**Learning:** Sequential network requests in loops and O(N*M) lookups in the task reminder route create significant latency and CPU overhead. In this codebase, where tasks and team members are stored in JSON and processed in-memory, O(N*M) becomes a bottleneck as the dataset grows.
**Action:** Refactor `check-reminders` to use a `Map` for O(1) team member lookups and `Promise.allSettled` for parallel notification delivery, reducing total execution time from O(N*M + N*L) to O(N + M + L) where L is the latency of the slowest notification.
