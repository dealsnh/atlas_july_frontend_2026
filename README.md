# Atlas County Scraper — Tina Frontend

Production-ready React + Vite frontend for the **National Houses / Atlas County Scraper** dashboard. This app provides the UI for county lead scraping, property condition analysis, and client settings.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 7** — dev server and production build
- **Tailwind CSS 4** — styling (`@tailwindcss/vite`)
- **Wouter** — client-side routing
- **Radix UI + shadcn/ui** — accessible component primitives (dialog, select, calendar, popover)
- **Zustand** — client state
- **Zod + react-hook-form** — form validation
- **Lucide React** — icons

## Prerequisites

- Node.js 18+
- npm
- Backend API running separately (default: `http://localhost:3000`) for `/api/*` routes

## Install and run

```bash
npm install
cp .env.example .env   # then edit values as needed
npm run dev
```

The dev server starts at **http://localhost:5173** and proxies `/api` and `/auth` requests to the local backend (`http://localhost:3000` by default in `vite.config.ts`).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Type-check and build for production → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run check` | TypeScript check without emit |
| `npm run format` | Format with Prettier |

## Folder structure

```
src/
├── components/
│   ├── atlas/        App-specific shared UI (AtlasSelect, AtlasDatePicker)
│   ├── ui/           shadcn primitives in use (button, calendar, dialog, popover, select, sonner)
│   └── AppLayout.tsx Shell layout + sidebar navigation
├── pages/            Route views (CountyScraper, PropertyCondition, Settings, Login, Signup)
├── services/         API calls (auth, leads, scrape, settings)
├── store/            Zustand stores (auth, leads, scrape, settings, stats)
├── types/            Shared TypeScript types
├── constants/        App config, routes, filters, status colors
├── validations/      Zod schemas (auth, settings)
├── lib/              Axios, API helpers, auth storage, utilities
├── App.tsx           Routing (Wouter) and auth gate
├── main.tsx          React entry point
└── index.css         Global styles + Tailwind theme

public/               Static assets (favicon, atlas.png)
```

### Layering

| Layer | Role |
|-------|------|
| `pages/` | UI + page state; calls stores and services |
| `store/` | Client state (Zustand) |
| `services/` | HTTP/API; no React |
| `lib/` | Shared utilities (axios, auth storage, formatting) |
| `constants/` | Static config and route paths (`APP_ROUTES`) |
| `validations/` | Zod schemas for forms |
| `types/` | Shared TypeScript interfaces |

## Environment variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Optional | API root including version prefix (e.g. `https://host/api/v1`). Leave empty to use same-origin `/api/v1` — Vite proxy in dev, `vercel.json` rewrite in production. |
| `VITE_API_WITH_CREDENTIALS` | Optional | Set to `true` when the API uses HttpOnly cookies or credentialed cross-origin requests. Default: `false`. |

> Only variables prefixed with `VITE_` are exposed to browser code via `import.meta.env`.

## API dependency

This frontend expects a backend exposing routes under `/api/v1/*`, for example:

- `GET/POST /api/v1/settings`
- `GET /api/v1/leads`, `GET /api/v1/stats`
- `POST /api/v1/scrape`, `GET /api/v1/scrape/stream` (SSE)
- And related endpoints used by `CountyScraper.tsx` and `Settings.tsx`

In production on Vercel, `/api/*` is proxied to the Railway backend via `vercel.json`. Locally, leave `VITE_API_BASE_URL` empty and run the Atlas backend on port 3000 (or update `DEV_PROXY_TARGET` in `vite.config.ts`).

## Migration note

UI migrated from `Atlas-naitonal-houses-tina` (`client/src/`). Server-side code (Express, scrapers, SQLite) was intentionally excluded from this repository.
