## 2025-05-03 - [Sequential Network Requests in Batch Operations]
**Learning:** The `check-reminders` route was using sequential `await` for each Telegram notification inside a loop, leading to O(N) latency. It also used linear searches (`Array.find`) inside the loop, resulting in O(N*M) complexity.
**Action:** Parallelize independent network requests using `Promise.allSettled` and use `Map` for O(1) lookups to ensure the route execution time remains stable as the number of tasks/users grows. Always check `res.ok` before updating local state flags to ensure data integrity on partial failures.
