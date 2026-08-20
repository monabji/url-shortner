# Repository Guidelines

## Project Structure & Module Organization

This repository contains a full-stack URL shortener:

- `client/`: React frontend and browser-facing UI.
- `server/`: Node.js/Express REST API, JSON-backed persistence, redirect handling, and tests.
- `server/data/`: generated local URL data; keep it untracked.
- `.env` files: local configuration for the backend; keep them untracked.

Add implementation files under the corresponding `client/` or `server/` directory rather than placing application code at the root.

## Build, Test, and Development Commands

Install dependencies independently in each application:

```bash
cd server && npm install
cd ../client && npm install
```

Run the backend with `cd server && npm run dev` and the frontend with `cd client && npm run dev` in separate terminals. Build the frontend for production with `cd client && npm run build`. Run the server tests with `cd server && npm test`. The client currently has no test files, so `cd client && npm test` reports that no tests were found.

## Coding Style & Naming Conventions

Use consistent 2-space indentation in JavaScript, JSX, JSON, and configuration files. Prefer clear, descriptive camelCase names for variables and functions, PascalCase for React components, and kebab-case for URL paths. Keep API concerns in `server/` and presentation concerns in `client/`. Use the formatter and linter configured by the relevant package; none are committed yet.

## Testing Guidelines

The server uses Node's built-in test runner (`node --test`) and has no coverage threshold. Server tests are black-box integration tests: they launch the API on an available local port and isolate `server/data/urls.json`, so tests must clean up child processes and restore the data file. Cover URL validation, short-code creation, redirect and click-count behavior, persistence/listing, and API error responses. Add tests alongside the feature they cover, using names that describe behavior (for example, `creates-short-url.test.js` or `UrlForm.test.jsx`).

## Commit & Pull Request Guidelines

The existing history uses short, imperative-style summaries (for example, `initial commit`). Keep commits focused and use concise imperative subjects such as `Add URL creation endpoint`.

Pull requests should explain the behavior change, list verification commands, link any related issue, and include screenshots for frontend changes. Call out environment-variable or database changes explicitly, and keep secrets out of commits.

## Security & Configuration

Validate HTTP/HTTPS destinations, guard against unsafe redirects, rate-limit URL creation, and generate unpredictable short codes. The current implementation validates protocols and uses cryptographically secure short codes, but does not yet provide rate limiting or production-grade database persistence; document or test any future changes. Store `PORT`, `CLIENT_URL`, and `BASE_URL` in local environment configuration rather than source control. Do not add `DATABASE_URL` until the server actually supports it.
