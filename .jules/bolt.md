# Bolt's Performance Journal

## 2025-03-05 - Baseline Journal Creation
**Learning:** Initiated Bolt's Performance Journal to track critical, codebase-specific performance patterns and avoid regressions.
**Action:** Always maintain and consult this journal for performance-centric optimizations.

## 2025-03-05 - Lexicographical ISO 8601 Comparison & O(1) Allocations in Leads API
**Learning:** Instantiating and parsing Date objects inside O(N) filtering loops and O(N log N) sorting loops generates significant CPU and heap allocation overhead in JS. Since ISO 8601 timestamps are lexicographically comparable, we can compute the boundary once outside the loop and use direct string comparison.
**Action:** Always use lexicographical string comparison for ISO 8601 strings when filtering or sorting in performance-critical code paths.
