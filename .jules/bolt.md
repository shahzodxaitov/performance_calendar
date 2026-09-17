# Bolt Journal - Critical Learnings

## 2025-05-18 - Unused Next.js Navigation Hooks Trigger Wasteful Re-renders
**Learning:** Calling `usePathname()` inside global layout components (like `Header`) subscribes the component to route changes. If the pathname is never actually rendered or checked, this triggers unnecessary component re-renders across the entire app on every page navigation.
**Action:** Always verify if navigation hooks like `usePathname()` or `useSearchParams()` are actively used before keeping them in global components.
