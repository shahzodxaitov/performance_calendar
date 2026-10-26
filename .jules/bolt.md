# Bolt's Journal - Critical Learnings

## 2026-03-25 - Telegram Webhook Route Optimization
**Learning:** Re-executing synchronous JSON file reads (`getTeamMembers()`) within conditional branches of webhook handlers causes redundant disk I/O and CPU overhead. Single-pass array operations (`findIndex`) eliminate dual array iterations when updating items.
**Action:** Always reuse in-scope data structures and combine find/findIndex operations into a single pass when updating data arrays in API route handlers.
