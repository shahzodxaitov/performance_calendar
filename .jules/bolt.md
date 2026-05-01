## 2025-05-22 - Handling project-wide lint/build failures
**Learning:** In this codebase, `npm run lint` and `npm run build` may fail due to pre-existing errors in unrelated files (e.g., unescaped entities, missing dependencies, or React Hook errors).
**Action:** Use `npx eslint <modified_file_path>` to verify specific changes when project-wide checks fail, and ensure that no *new* regressions are introduced by the performance optimizations.
