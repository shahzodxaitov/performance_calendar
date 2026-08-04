# Bolt's Performance Journal

## 2025-08-04 - Initializing Performance Journal
**Learning:** Baseline performance journal initialized to track critical performance learnings.
**Action:** Document future performance-related learnings here.

## 2025-08-04 - Object Mutation Order in Date Reuse Optimization
**Learning:** Reusing a single `Date` instance to calculate period boundaries (`startTimestamp` and `endUnix`) can cause correctness regressions if start-of-period resets (such as `.setHours(0,0,0,0)` followed by `.setDate(1)`) are done before computing `endUnix`. This results in `endUnix` representing the end of the first day of the period instead of the end of the current day.
**Action:** Always compute `endUnix` (e.g., at 23:59:59.999) first before resetting the Date instance to start-of-period bounds, or perform calculation sequencing that avoids side-effects.
