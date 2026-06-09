# Atlas County Scraper — Tina Frontend

Production-ready React + Vite frontend for the **National Houses / Atlas County Scraper** dashboard. This app provides the UI for county lead scraping, property condition analysis, and client settings.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 7** — dev server and production build
- **Tailwind CSS 4** — styling (`@tailwindcss/vite`)
- **Wouter** — client-side routing
- **Radix UI + shadcn/ui** — accessible component primitives
- **Recharts** — charts (where used)
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
├── components/       Shared UI (AppLayout, Map, ErrorBoundary, …)
│   └── ui/           shadcn/Radix primitives (Button, Dialog, Table, …)
├── pages/            Route-level views (CountyScraper, Settings, Login, …)
├── hooks/            Custom hooks (useMobile, useComposition, …)
├── contexts/         React context providers (ThemeContext)
├── lib/              Utilities (cn helper via utils.ts)
├── App.tsx           Root routing and auth gate
├── main.tsx          React entry point
├── index.css         Global styles + Tailwind theme
└── const.ts          Shared constants and OAuth URL helper

shared/               Cross-package constants used by the frontend
public/               Static assets served as-is
```

## Environment variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Optional | API root including version prefix (e.g. `https://host/api/v1`). Leave empty to use same-origin `/api/v1` — Vite proxy in dev, `vercel.json` rewrite in production. |
| `VITE_OAUTH_PORTAL_URL` | Optional | OAuth portal base URL |
| `VITE_APP_ID` | Optional | OAuth application ID |
| `VITE_FRONTEND_FORGE_API_KEY` | Optional | Google Maps proxy API key |
| `VITE_FRONTEND_FORGE_API_URL` | Optional | Maps proxy base URL |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Umami analytics endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Umami website ID |

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
