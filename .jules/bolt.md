# Bolt Performance Journal

## 2025-05-20 - Memoizing Modal Options & Cleaning Effect Dependencies
**Learning:** In React modal components, inline array filtering (such as `companies.filter(c => c.id !== "all")`) and un-guarded `setState` inside `useEffect` triggered on every dependency change create redundant re-renders and React state update cascades.
**Action:** Memoize array filters outside component JSX render tree with `useMemo`, hoist static configuration arrays outside the component, and guard `useEffect` state syncing to prevent cascading renders when props or modal visibility change.
