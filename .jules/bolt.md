## 2025-08-30 - Header User Initials Memoization & Cleanup
**Learning:** In header components that render on every route change or parent re-render, un-memoized string manipulations like `user?.user_metadata?.full_name?.substring(0, 2).toUpperCase()` cause unnecessary string allocations during re-renders.
**Action:** Wrap string derivation for user initials in `useMemo` dependent on `user?.user_metadata?.full_name` and clean up unused routing hooks.
