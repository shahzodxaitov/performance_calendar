## Baseline Performance Journal - Bolt

Welcome to the journal.

## 2025-02-18 - [Avoid Date Instance Allocations inside Filter & Sort Loops]
**Learning:** Instantiating `Date` objects from ISO 8601 strings inside `.filter()` and `.sort()` loops creates massive memory and CPU overhead ($O(N \log N)$ allocations). Because ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`) is inherently lexicographically sortable, we can compare raw string timestamps directly using native operators (`>`, `<`, `>=`).
**Action:** Always compute reference dates exactly once outside loops, convert them to ISO strings, and use direct lexicographical string comparisons (`l.created_at >= startIsoString`) inside filter/sort functions.
