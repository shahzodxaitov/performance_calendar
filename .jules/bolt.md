# Performance Journal

## 2025-03-03 - Parallelized Telegram Reminders and O(N+M) Map Lookup
**Learning:** Sequential network I/O in API routes scales poorly ($O(K \times \text{RTT})$) and severely affects response times as active tasks grow. Parallelizing requests with `Promise.allSettled` cuts execution down to $O(\text{RTT})$ while ensuring individual network failures do not halt other notifications. Additionally, replacing nested loops with `Map` lookups reduces algorithmic complexity from $O(N \times M)$ to $O(N + M)$ with minimal memory footprint.
**Action:** When performing batch updates or outbound notifications, aggregate independent asynchronous tasks into a single batch and await them with `Promise.allSettled` while updating internal state variables only on successful promise execution.
