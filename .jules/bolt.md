## 2025-05-14 - Optimized check-reminders route

**Learning:** Batch processing of network requests in serverless functions (like Next.js API routes) can significantly reduce total execution time and avoid timeout issues. Replacing O(N*M) lookups with O(N+M) using a Map is a fundamental win for scalability.

**Action:** Always check for linear searches inside loops that could be replaced by Maps. Parallelize independent network requests using `Promise.allSettled` to reduce total latency.
