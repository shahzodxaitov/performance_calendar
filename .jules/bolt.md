## 2025-05-20 - Context Value Memoization & Conditional Modal Mounting

**Learning:** Unmemoized context value objects in root providers (`CompanyContext`) trigger full app consumer re-renders on any provider update. Additionally, unconditioned modal components run state initialization and effect hooks even when hidden.
**Action:** Always wrap `CompanyContext.Provider` values in `useMemo` (and context callbacks in `useCallback`), and conditionally render modal components (`isModalOpen && <Modal />`) to avoid unneeded component tree mounts.
