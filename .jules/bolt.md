## 2025-05-22 - [Optimization of batch reminder job]
**Learning:** The `check-reminders` API route was performing sequential await calls for Telegram notifications within a loop, leading to O(N * latency) execution time. Additionally, team member lookups were O(M) inside the O(N) task loop, resulting in O(N*M) complexity.
**Action:** Use `Promise.all` to parallelize network requests and a `Map` for O(1) lookups. Always ensure `saveTasks` is called after parallel operations complete to maintain state integrity.

## 2025-05-22 - [Environment package downgrades]
**Learning:** Running `npm install` or `npm run build` in this environment can automatically downgrade `next` and `react` versions in `package-lock.json` and change `tsconfig.json` (e.g., `jsx: preserve`), which might introduce security vulnerabilities or build issues.
**Action:** Always verify `package-lock.json` and `tsconfig.json` after running build/install commands and use `git restore` to revert unauthorized changes.
