## 2024-05-13 - Parallelizing state-modifying network requests

**Learning:** When parallelizing multiple network requests (e.g., Telegram notifications) that trigger state updates (e.g., setting `notified_1day = true`), using `Promise.allSettled` is safer than `Promise.all`. It ensures that a single failed request doesn't block the processing of other successful ones. Furthermore, helper functions must return success indicators (like a boolean) so that state persistence logic can accurately reflect which operations actually succeeded.

**Action:** Use `Promise.allSettled` for batch operations and ensure return values from async helpers are used to gate state updates.

## 2024-05-13 - Environment side-effects of `npm install` and `npm run build`

**Learning:** In this environment, running `npm install` or `npm run build` can lead to unauthorized modifications of `package-lock.json` (specifically downgrading `next` version) and `tsconfig.json`. These changes can introduce security vulnerabilities or deviate from project standards.

**Action:** Always check `git status` after running build or install commands and revert changes to `package-lock.json` and `tsconfig.json` using `git restore` if they were not explicitly requested.
