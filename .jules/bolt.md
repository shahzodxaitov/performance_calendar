# Bolt's Journal - Performance Optimizations

## 2026-03-29 - Shared Report Page & Telegram Route Optimization
**Learning:** Recharts components trigger frequent re-renders during mouse move/hover events. Directly constructing card object arrays inside the render function body causes continuous garbage collection allocations during chart tooltip movements. Additionally, sequential `find` and `findIndex` calls on JSON store arrays double traversal overhead unnecessarily.
**Action:** Always wrap stats and UI objects rendered alongside interactive charts in `useMemo`, and combine store array search/indexing into a single `findIndex` pass.
