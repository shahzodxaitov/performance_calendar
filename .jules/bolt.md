## 2025-05-18 - Calendar Grid & Task Grouping Memoization

**Learning:** Re-computing calendar day grids and grouping tasks by `due_date` using `Array.prototype.reduce` on every render causes unnecessary array allocations and O(N) operations across all task items during parent re-renders or date/modal toggles.

**Action:** Wrap date calculations (`daysInMonth`, `firstDay`), grid array generation (`days`), and task grouping dictionary creation (`eventsByDate`) in React's `useMemo` hook with explicit dependencies. Furthermore, ensure async data fetching inside `useEffect` utilizes an `isMounted` flag pattern to prevent ESLint `react-hooks/set-state-in-effect` warnings.
