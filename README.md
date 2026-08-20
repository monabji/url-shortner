# URL Shortener

A small full-stack URL shortener built with React, Vite, Node.js, and Express. Links are stored locally in `server/data/urls.json`, so no external database is required for development.

## Run locally

Prerequisite: Node.js 18+.

Install dependencies in each application:

```bash
cd server && npm install
cd ../client && npm install
```

Copy `.env.example` to `server/.env` if you need to change the defaults. Start the API and frontend in separate terminals:

```bash
cd server && npm run dev
cd client && npm run dev
```

Open `http://localhost:5173`. The API listens on `http://localhost:5000` by default.

The server creates `server/data/urls.json` on first start. This local data file is intentionally ignored by Git and is not suitable for multi-process or production persistence.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Port used by the API server |
| `CLIENT_URL` | `http://localhost:5173` | Origin allowed by CORS |
| `BASE_URL` | derived from the request | Base URL returned in generated short links |

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Return `{ "status": "ok" }` |
| `GET` | `/api/urls` | List created links, newest first |
| `POST` | `/api/urls` | Create a link from `{ "originalUrl": "https://example.com" }` |
| `GET` | `/:code` | Redirect to the original URL and increment its click count |

Only HTTP and HTTPS destinations are accepted. A successful create response includes `code`, `originalUrl`, `clicks`, `createdAt`, and `shortUrl`. Invalid destinations return HTTP 400; unknown short codes return HTTP 404.

## Tests and production build

```bash
cd server && npm test
cd client && npm run build
```

The server tests start the API on an available local port, exercise health, validation, creation, listing, redirect, click counting, and not-found behavior, then restore the local data file. The client build verifies that the React bundle compiles successfully.

## Project layout

- `client/` - React UI, Vite configuration, and responsive styles.
- `server/` - Express routes, JSON-backed persistence, and tests.
- `AGENTS.md` - contributor and automation guidance.

Do not commit `.env` files, generated data, dependencies, coverage output, or build output.
