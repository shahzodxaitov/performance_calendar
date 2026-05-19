## 2025-05-15 - Parallelizing State-Modifying Batch Notifications
**Learning:** When parallelizing notifications that modify local state (e.g., setting `notified_1day = true`), simple `Promise.all` can lead to inconsistent state if the network request fails but the flag is still set. Using `Promise.allSettled` and verifying the `res.ok` status of the fetch before updating the in-memory object ensures state integrity.
**Action:** Always return a success indicator from async I/O helpers and verify fulfillment/success before committing state changes in batch processes.

## 2025-05-15 - Map-based lookups for N*M bottlenecks
**Learning:** In routes that iterate over tasks and look up assignees/members, the complexity often creeps to O(N*M). Converting the lookup array to a Map at the start of the request is a high-impact, low-cost optimization.
**Action:** Profile loops for nested `.find()` or `.filter()` calls and replace with Map lookups.
