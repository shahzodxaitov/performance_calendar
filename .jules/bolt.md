# Bolt Performance Journal

## 2025-05-18 - Memoize filtered company lists in React components
**Learning:** Re-filtering static context arrays (such as filtering out "all" company options) on every component re-render creates unnecessary array heap allocations and triggers React re-render passes.
**Action:** Wrap context array filtering operations in `useMemo` with appropriate context dependencies.
