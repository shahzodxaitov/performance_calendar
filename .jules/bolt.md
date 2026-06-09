## 2025-05-15 - Optimized task reminder batch processing
**Learning:** Using a `Map` for O(1) lookups and `Promise.allSettled` for parallelizing independent network requests significantly improves the performance of batch operations. Additionally, hoisting the baseline timestamp (`nowMs`) avoids redundant O(N) `Date` object instantiations and potential drift during long-running loops.
**Action:** Always replace linear `find`/`filter` inside loops with `Map` lookups if the search key is unique, and parallelize API calls in batch jobs to reduce total latency.
