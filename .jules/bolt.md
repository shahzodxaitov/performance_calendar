## 2025-05-14 - [Environment Side Effects]
**Learning:** Running `npm install` or `npm run build` can trigger automatic downgrades of packages (like `next`) and reconfigurations of `tsconfig.json` (e.g., `jsx: preserve`), which violate persona boundaries and can introduce security vulnerabilities.
**Action:** Always verify `git status` after build/install commands and use `git restore` on any unintended configuration or lockfile changes before submission.
