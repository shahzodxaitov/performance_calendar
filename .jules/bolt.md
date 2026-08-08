# Bolt's Performance Journal

## 2025-02-15 - Initial Journal
**Learning:** Baseline journal initialized.
**Action:** Always maintain and follow instructions.

## 2025-02-15 - Nested Loop to Map lookup and Parallel I/O
**Learning:** In the task reminder checker api route (`src/app/api/tasks/check-reminders/route.ts`), retrieving team details inside a loop yielded an O(N * M) time complexity where N is the number of tasks and M is the number of team members. Swapping this nested `.find()` logic for a pre-built ID-to-member map reduces the algorithmic lookup footprint to O(N + M). Furthermore, executing sequential API notification delivery requests created blocking synchronous latencies. Parallelizing with `Promise.allSettled` eliminates consecutive API fetch blockages.
**Action:** Use Map data structures for constant-time ID indexing instead of O(M) lookup helpers within iterations, and leverage `Promise.allSettled` to resolve async parallel requests in a single non-blocking event-loop tick.
