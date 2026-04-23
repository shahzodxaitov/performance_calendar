## 2025-05-15 - Optimize reminder check lookup
**Learning:** Replacing linear searches (`Array.prototype.find`) inside loops with a `Map` lookup reduces algorithmic complexity from O(N * M) to O(N + M). This is especially important for batch operations like checking task reminders where both the number of tasks and team members can grow.
**Action:** Always look for O(N*M) nested loops and consider if a Map-based lookup can optimize it to O(N+M).
