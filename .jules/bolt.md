## 2025-05-15 - Optimize team member lookup in reminders
**Learning:** Replacing linear searches (`Array.prototype.find`) inside loops with a `Map` lookup reduces algorithmic complexity from O(N * M) to O(N + M), which is a critical pattern for scaling batch operations like reminder checks.
**Action:** Always consider converting arrays to Maps or Sets when performing frequent lookups within a loop.
