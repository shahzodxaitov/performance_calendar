# Bolt's Performance Journal

## Baseline
- Memory profiling and micro-benchmark tracking for Kalendar application.

## 2025-05-18 - [Supabase Client Instantiation & URL Parsing in API Routes]
**Learning:** Re-instantiating Supabase clients via inline `require()` inside API request handlers creates unnecessary heap allocations and triggers ESLint `@typescript-eslint/no-require-imports` errors. Utilizing the pre-configured `@/lib/supabase` singleton and `request.nextUrl.searchParams` avoids object allocation overhead per HTTP request.
**Action:** Always import existing `@/lib/supabase` singletons and use `request.nextUrl.searchParams` in Next.js App Router handlers.
