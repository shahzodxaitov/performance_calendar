# Bolt's Journal - Critical Learnings Only

## 2026-03-24 - Initial setup
**Learning:** Performance optimizations in Next.js API routes benefit significantly from replacing sequential network requests (`await`) with concurrent execution (`Promise.allSettled`) and replacing O(N) array searching (`find()`) with O(1) `Map` lookups.
**Action:** Always check loop structures for `find()` operations and sequential `await` calls that can be parallelized.
