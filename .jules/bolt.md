# Bolt Performance Journal

## 2025-08-06 - [Task Reminder Performance Optimization]
**Learning:** Found that `src/app/api/tasks/check-reminders/route.ts` has two major performance bottlenecks:
1. It performs an O(T * M) nested lookup where for every task (T) it does a `.find` on the team array (M) to get the assignee.
2. It sends Telegram notifications sequentially using `await fetch` inside the loop, blocking the main event loop and adding latency linear to the number of tasks.

**Action:**
1. Caching a baseline timestamp `nowMs` outside the loop reduces O(N) Date creations/accesses.
2. Building an O(M) Map of the team members reduces assignee lookup time complexity from O(T * M) down to O(T + M).
3. Utilizing `Promise.allSettled` parallelizes Telegram notifications across all tasks concurrently, transforming sequential latency bottleneck (O(N) HTTP requests) to concurrent latency.
4. Ensuring that task flags are only updated if the Telegram API notification actually succeeds improves system reliability and consistency.
