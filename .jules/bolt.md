## 2024-04-30 - [O(N^2) to O(N) optimization in Reminder Checks]
**Learning:** Found a classic O(N*M) bottleneck where the system performed a linear search through the 'team' array for every 'task' during reminder processing. This is a common anti-pattern in batch processing scripts.
**Action:** Use a 'Map' for O(1) lookups whenever performing multiple lookups against a static collection within a loop. Also, parallelize independent I/O operations (like Telegram notifications) using 'Promise.allSettled' to minimize total latency.
