## 2025-05-15 - [O(N*M) Batch Task Reminders]
**Learning:** The `check-reminders` API route was performing a linear search (`.find()`) on the `team` array for every `task` object. While the data set is currently small, this creates an $O(N \cdot M)$ complexity that scales poorly as more users and tasks are added.
**Action:** Replace linear searches inside loops with a `Map` lookup to reduce algorithmic complexity to $O(N + M)$ and hoist static values like `now.getTime()` outside loops.
