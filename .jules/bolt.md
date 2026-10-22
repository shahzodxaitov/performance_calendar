## 2025-05-18 - Prevent cascading re-renders in React Context providers
**Learning:** Unmemoized context value objects in React Context providers cause every component subscribing to the context to re-render whenever the provider re-renders, even if internal context values haven't changed.
**Action:** Always wrap context provider value objects in `useMemo` and context functions in `useCallback`.
