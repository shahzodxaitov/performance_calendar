## 2025-05-22 - Unexpected Dependency Downgrades in package-lock.json

**Learning:** Running `npm install` or `npm run build` in this environment can result in an unexpected downgrade of critical packages (specifically `next` from 15.1.0 to 15.0.0) in `package-lock.json`, which introduces security vulnerabilities (e.g., CVE-2025-66478).

**Action:** Always verify `package-lock.json` changes after running build or install commands and revert unauthorized downgrades using `git restore package-lock.json` to maintain security and project integrity.
