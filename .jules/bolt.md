## 2025-05-15 - Optimize Task Reminders API

**Learning:** Sequential `await` in loops for external API calls (Telegram) significantly increases endpoint latency. Linear searches in loops ($O(N \times M)$) are easily optimized with Maps ($O(N + M)$).

**Action:** Always parallelize independent I/O using `Promise.allSettled` and replace linear lookups with Map lookups in batch processing logic. Use numeric timestamps for arithmetic to avoid repeated `Date` method calls.
