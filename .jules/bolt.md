## 2025-05-14 - Unauthorized Config Changes & Build Blockers

**Learning:** Running `npm install` or `next build` in this environment can automatically downgrade the `next` package in `package-lock.json` and modify `tsconfig.json` (e.g., setting `jsx` to `preserve`). Additionally, pre-existing lint errors in unrelated files block the global `npm run build`.

**Action:** Always verify and revert changes to `package-lock.json` and `tsconfig.json` using `git restore` if they are not explicitly authorized. Use `npx eslint <path>` to verify specific changes locally when the global build is failing due to external errors.
