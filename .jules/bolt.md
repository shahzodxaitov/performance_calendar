## 2024-05-22 - Optimized task reminder processing complexity
**Learning:** Found an (N \times M)$ bottleneck in the task reminder API where it was performing a linear search for team members within a loop of tasks. For large numbers of tasks and team members, this leads to unnecessary computational overhead.
**Action:** Use a `Map` to index frequently accessed data by ID before entering loops, reducing lookups to (1)$ and overall complexity to (N + M)$.
