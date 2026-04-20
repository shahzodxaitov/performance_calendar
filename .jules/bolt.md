## 2025-05-14 - Map Lookup for Batch Operations
**Learning:** Using `Array.prototype.find()` inside a loop (O(N*M)) over tasks and team members creates a significant bottleneck as the dataset grows.
**Action:** Always prefer creating a temporary `Map` (O(N+M)) when performing lookups against a second dataset within a loop.

## 2025-05-14 - String Hoisting in React Filters
**Learning:** Repetitive `.toLowerCase()` calls on a search query inside a `filter()` function add unnecessary O(N) overhead during component renders.
**Action:** Hoist invariant transformations (like search query normalization) outside the loop and use `useMemo` to skip filtering entirely if dependencies haven't changed.
