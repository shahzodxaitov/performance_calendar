## 2025-05-20 - Concurrent Telegram Notifications & Map Lookups in Cron API Routes
**Learning:** Sequential `await` network requests in cron endpoints handling task notifications degrade response times proportionally to task count O(N). Building a `Map` for team member chat IDs eliminates O(N*M) nested array searches, while primitive timestamp operations (`Date.parse()`) avoid per-item heap allocations.
**Action:** Always pre-build `Map` lookups for entity associations and collect network promises to execute via `Promise.allSettled()` in cron/batch notification endpoints.
