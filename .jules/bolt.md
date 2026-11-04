# Bolt's Performance Journal

Critical learnings only.

## 2025-05-18 - Baseline Performance Journal
**Learning:** Telegram API notifications in background routes can introduce significant serial latency if awaited one-by-one in task loops.
**Action:** Always batch external HTTP webhooks/notifications and dispatch them concurrently with `Promise.allSettled`, while ensuring task mutation flags are only set on successful delivery.
