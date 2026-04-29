## 2025-03-24 - Parallel Notifications with State Integrity
**Learning:** When parallelizing state-modifying network requests (like Telegram notifications) using `Promise.allSettled`, a simple array of callbacks mapped to the promise indices allows for granular state updates. This ensures that local database flags (e.g., `notified_1day`) are only set if the external API call actually succeeded.
**Action:** Use the `updateCallbacks` pattern when batching asynchronous operations that must conditionally update local state based on individual fulfillment.
