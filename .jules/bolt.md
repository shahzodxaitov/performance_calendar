## 2025-05-18 - Memoizing Recharts Dashboard Aggregations

**Learning:** Charts implemented with libraries like Recharts trigger rapid component re-renders during user hover and cursor movement over data points. Any unmemoized array filtering or object array allocations inside the page component body will run on every single mouse frame during tooltip rendering.
**Action:** Always wrap statistical aggregations (`displayStats`) and array filtering operations (`newLeadsCount = realLeads.filter(...)`) in `useMemo` hooks when rendering alongside interactive Recharts components.
