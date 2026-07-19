# Bolt ⚡ Performance Journal

## 2025-07-20 - Optimizing Client App Token GET Route and Security Fallback Cleanup
**Learning:**
1. Using direct lexicographical comparisons for ISO 8601 strings is ~30x faster than parsing them into Date objects for filter and sort logic.
2. In loop processing, reusing a single `Date` instance with `.setTime()` or mutating a shared date pointer avoids substantial garbage collection overhead by keeping allocation to O(1) instead of O(N).
3. Accessing Next.js query params via `request.nextUrl.searchParams` avoids creating an intermediate `URL` parser instance on every incoming API request.
4. Keeping hardcoded fallback tokens poses a critical security risk and violates persona instructions; they must always be replaced with clean defaults (`""`).

**Action:**
1. Always replace `new URL(request.url)` with `request.nextUrl.searchParams`.
2. Convert filter boundaries to string representations once outside filters and use native string operators (`<`, `>`, `===`) on ISO 8601 timestamps instead of parsing inside loops.
3. Keep clean environment variable fallbacks and completely eliminate hardcoded secrets from routing scripts.
