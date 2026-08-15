# Bolt's Journal

## 2025-08-15 - Hoisting getInitials Helper Outside React Render Loop in TeamPage
**Learning:** Helper utility functions declared inside React component bodies are re-created on every render cycle, leading to unnecessary garbage collection pressure and allocation overhead during state updates and initial renders.
**Action:** Always hoist pure helper functions that don't depend on component props or state outside the component definition.
