# Bolt's Performance Journal

## 2025-05-14 - Baseline
**Learning:** Initializing the performance journal to track optimizations in the Kalendar project. The project uses a hybrid of Supabase and a local JSON store. Several API routes perform sequential network requests and O(N*M) lookups.
**Action:** Focus on batch processing routes and expensive loops for maximum impact.
