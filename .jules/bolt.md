# Bolt's Performance Journal

## 2026-04-13 - Memoizing Calendar Day Grid & Task Grouping Arrays
**Learning:** In date-grid UI components like `CalendarPage`, dynamic day arrays and task grouping (`reduce`) recalculations on every render allocate new array and object references continuously. Wrapping day grid generation (`days`) and task-by-date dictionary indexing (`eventsByDate`) in `useMemo` avoids array re-allocations during re-renders, and conditionally mounting modal components (`isModalOpen && <TaskModal ... />`) prevents execution of state hooks in child modals when hidden.
**Action:** When working on calendar or list views, always memoize grid structures and reduce operations with `useMemo`, and conditionally render dialogs/modals instead of using `isOpen` props on unconditionally rendered modal components.
