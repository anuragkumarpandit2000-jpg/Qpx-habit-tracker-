---
name: QPX player profile null pattern
description: Why GET /player/profile returns null (200) instead of 404 when no player exists
---

## Rule
`GET /api/player/profile` returns `res.status(200).json(null)` when no player row exists in the DB — not a 404.

**Why:** Vite's `@replit/vite-plugin-runtime-error-modal` intercepts `unhandledrejection` events at the browser level, independently of React Query. Even with `throwOnError: false` and a capturing `unhandledrejection` listener in `main.tsx`, the Replit plugin registers its listener before React loads and catches the rejection first, showing the error overlay. Since "no player yet" is a valid app state (during onboarding), it must not be modelled as an HTTP error.

**How to apply:** Any endpoint that may legitimately return "nothing" for a new/fresh user should return `200 + null` rather than 404. Client-side code checks `data === null` or uses optional chaining (`player?.field`). The layout already guards all player-dependent UI with `{player && ...}`.
