## 2025-05-15 - [ISO 8601 String Comparison vs Date Objects]
**Learning:** In this codebase's architecture (Next.js with local JSON store), direct lexicographical string comparison for ISO 8601 timestamps is significantly faster than instantiating 'Date' objects for every item during filtering and sorting. For 10k items, sorting takes ~10ms vs ~270ms.
**Action:** Always prefer string comparison (`>=`, `<=`, `localeCompare`) for ISO 8601 strings in loops, filters, and sorters.

## 2025-05-15 - [Dependency Side Effects]
**Learning:** Running `npm install` in this environment can lead to unauthorized changes in `package-lock.json` (e.g., downgrading Next.js to a version with a security vulnerability).
**Action:** Always verify and revert changes to `package-lock.json` and `package.json` unless explicitly instructed to modify dependencies.
