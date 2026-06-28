# AGENTS.md — Prenotazioni Mensa Frontend

## Commands (Bun only — never npm/yarn/pnpm)

| Command          | What it does                                                |
| ---------------- | ----------------------------------------------------------- |
| `bun install`    | Install deps                                                |
| `bun dev`        | Dev server on `$PORT` or 3000                               |
| `bun run build`  | **Type-check then build** (`run-p type-check "build-only"`) |
| `bun type-check` | `vue-tsc --build`                                           |
| `bun test:unit`  | Vitest (jsdom)                                              |
| `bun lint`       | ESLint flat config — `--fix --cache`                        |
| `bun format`     | Prettier — no semicolons, single quotes, width 100          |

## Gotchas

- **Build runs type-check + build**: `bun run build` uses `run-p type-check "build-only"` — both run in parallel. A type error fails the whole build even if `vite build` succeeds, so fix type errors first.
- **UTC deadline is DST-broken (don't trust it)**: Menu deadlines are stored as a bare time-of-day `"HH:MM:SS"` in UTC with no date. `src/api/admin/menus.ts` converts to/from local with `convertUtcToLocalTime` (display) and `toUTCTime` (save). This is fundamentally unsound: a wall-clock time has no fixed UTC offset (Italy is UTC+1 winter / UTC+2 summer), so the value drifts by an hour across DST. Display un-bakes the offset using `menu.day`, but `createMenu`'s default deadline bakes it using `new Date()` (today), so a menu created in one season displays an hour off in the other. It also uses the *browser's* timezone, not a fixed `Europe/Rome`. If you're reworking menus, store either a fixed business-timezone time-of-day (display verbatim, no conversion) or a full UTC timestamp per menu — don't keep the bare-UTC-time-of-day model.
- **PWA manifest**: `public/manifest.json` is the single source of truth. VitePWA's `manifest` is set to `false` to suppress the duplicate `manifest.webmanifest` link. Edit `public/manifest.json` to change PWA metadata — do not add a `manifest:` block back to `vite.config.ts`.
- **Auth store is persisted**: `pinia-plugin-persistedstate` writes JWT/refresh token to localStorage. Clear it when testing auth flows.
- **Guest users**: Created with auto-generated email `{username}@guest.local` and random password — they cannot log in directly.

## Architecture

- **Vue 3** + Composition API (`<script setup lang="ts">` everywhere)
- **Pinia** stores with setup-function style in `src/stores/`
- **Vue Router** with `createWebHistory` — all views lazy-loaded
- **Axios** instance in `src/api/client.ts` with JWT interceptor (auto-refresh on 401)
- **i18n**: Italian (primary), English (fallback) — `src/i18n.ts`
- **shadcn-vue** (New York style) + reka-ui + lucide-vue-next + Tailwind v4
- **Backend**: Strapi v5 REST API at URL from `VITE_API_BASE_URL` env var (default: Railway production URL in `.env`)

## Routes

| Path                                                         | Guard                                                |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `/login`                                                     | Redirects if authed                                  |
| `/menu`, `/order`                                            | `authGuard`                                          |
| `/guests`, `/guests/:guestId/menu`, `/guests/:guestId/order` | `guestAreaGuard` (needs `canInviteGuest` permission) |
| `/admin/**`                                                  | `adminGuard` (needs admin role)                      |
| `/`                                                          | Redirects to `/order`                                |

## Quirks

- **No CI/CD, no pre-commit hooks, no lint-staged** — no enforced pipeline
- **Deployment**: Railway via Nixpacks + Caddy (`Caddyfile` serves `dist/` with SPA fallback). `nixpacks.toml` installs Caddy via Nix.
- **CSV import**: Uses papaparse. Menu CSV columns: `day, primo, secondo, contorno, dessert, acqua`.
- **Vite dev server port**: 3000 (or `$PORT` env), not the Vite default 5173.
- **Test env**: jsdom with `@vue/test-utils`. No e2e tests configured.
- **TypeScript**: Strict mode, path alias `@/` → `src/`. Multiple tsconfig files (app, node, vitest).
