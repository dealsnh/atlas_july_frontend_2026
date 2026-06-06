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

The dev server starts at **http://localhost:5173** and proxies `/api` requests to the backend (`VITE_API_PROXY_TARGET`, default `http://localhost:3000`).

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
| `VITE_API_PROXY_TARGET` | Dev only | Backend URL for Vite `/api` proxy (default: `http://localhost:3000`) |
| `VITE_OAUTH_PORTAL_URL` | Optional | OAuth portal base URL |
| `VITE_APP_ID` | Optional | OAuth application ID |
| `VITE_FRONTEND_FORGE_API_KEY` | Optional | Google Maps proxy API key |
| `VITE_FRONTEND_FORGE_API_URL` | Optional | Maps proxy base URL |
| `VITE_ANALYTICS_ENDPOINT` | Optional | Umami analytics endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional | Umami website ID |

> Only variables prefixed with `VITE_` are exposed to browser code via `import.meta.env`.

## API dependency

This frontend expects a backend exposing routes such as:

- `GET/POST /api/settings`
- `GET /api/leads`, `GET /api/stats`
- `POST /api/scrape`, `GET /api/scrape/stream` (SSE)
- And related endpoints used by `CountyScraper.tsx` and `Settings.tsx`

Run the Atlas backend separately and ensure `VITE_API_PROXY_TARGET` points to it during local development.

## Migration note

UI migrated from `Atlas-naitonal-houses-tina` (`client/src/`). Server-side code (Express, scrapers, SQLite) was intentionally excluded from this repository.
