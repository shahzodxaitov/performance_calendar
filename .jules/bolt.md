# Bolt's Performance Journal

## 2026-03-22 - Avoid micro-memoization of trivial string operations
**Learning:** Wrapping trivial string operations (e.g. `substring(0, 2)`) in `useMemo` introduces hook instantiation and dependency-checking overhead that exceeds the execution cost of the string operation itself. Focus instead on structural optimizations such as removing unused hook subscriptions (e.g. `usePathname()`) that trigger re-renders on route changes.
**Action:** Do not use `useMemo` for cheap primitives or short string operations; prioritize removing unused state or hook listeners that cause unnecessary React re-renders.
