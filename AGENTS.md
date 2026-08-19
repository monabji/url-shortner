# Repository Guidelines

## Project Structure & Module Organization

This repository is a full-stack URL shortener. The intended layout is:

- `client/`: React frontend and browser-facing UI.
- `server/`: Node.js/Express REST API, URL persistence, and redirect handling.
- `.env` files: local configuration for the backend; keep them untracked.

The repository currently contains the project README and scaffolding guidance. Add implementation files under the corresponding `client/` or `server/` directory rather than placing application code at the root.

## Build, Test, and Development Commands

Install dependencies independently in each application:

```bash
cd server && npm install
cd ../client && npm install
```

Run the backend with `cd server && npm run dev` and the frontend with `cd client && npm start` in separate terminals. Build the frontend for production with `cd client && npm run build`. Once package scripts are added, run the available test suites with `cd server && npm test` and `cd client && npm test`.

## Coding Style & Naming Conventions

Use consistent 2-space indentation in JavaScript, JSX, JSON, and configuration files. Prefer clear, descriptive camelCase names for variables and functions, PascalCase for React components, and kebab-case for URL paths. Keep API concerns in `server/` and presentation concerns in `client/`. Use the formatter and linter configured by the relevant package; none are committed yet.

## Testing Guidelines

No test framework or coverage threshold is configured currently. Add tests alongside the feature they cover, using names that describe behavior (for example, `creates-short-url.test.js` or `UrlForm.test.jsx`). Cover URL validation, short-code creation, redirect behavior, and API error responses.

## Commit & Pull Request Guidelines

The existing history uses short, imperative-style summaries (for example, `initial commit`). Keep commits focused and use concise imperative subjects such as `Add URL creation endpoint`.

Pull requests should explain the behavior change, list verification commands, link any related issue, and include screenshots for frontend changes. Call out environment-variable or database changes explicitly, and keep secrets out of commits.

## Security & Configuration

Validate HTTP/HTTPS destinations, guard against unsafe redirects, rate-limit URL creation, and generate unpredictable short codes. Store `PORT`, `DATABASE_URL`, `CLIENT_URL`, and `BASE_URL` in local environment configuration rather than source control.
