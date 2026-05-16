## 2025-05-14 - Direct Lexicographical String Comparison for ISO 8601
**Learning:** For performance-critical code involving ISO 8601 timestamps, direct lexicographical string comparison using operators ('<', '>', '===') is significantly faster than 'Date' object instantiation. In the `leads` API route, replacing `new Date(l.created_at).getTime()` inside `.filter()` and `.sort()` reduces O(N) and O(N log N) overhead.
**Action:** Use string comparisons for ISO 8601 timestamps in hot paths instead of converting to Date objects.

## 2025-05-14 - Tool-induced Configuration Changes
**Learning:** Commands like `npm run build` or `next build` may automatically modify `tsconfig.json` (e.g., changing `jsx` from `react-jsx` to `preserve`). These changes are often considered boundary violations by reviewers.
**Action:** Always verify and revert unauthorized changes to `package.json` or `tsconfig.json` using `git restore` before submitting.
