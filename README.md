# Todo List (Next.js + FastAPI)

A simple todo-list **frontend** built with Next.js. It talks to a FastAPI
backend over a small REST API. The backend is not included yet — the UI is
wired up against the expected routes and degrades gracefully when the API is
unreachable.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Point the app at your backend by creating a `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Expected backend API

The client in [`app/lib/api.ts`](app/lib/api.ts) expects these FastAPI routes:

| Method | Path          | Body                  | Returns        |
| ------ | ------------- | --------------------- | -------------- |
| GET    | `/todos`      | —                     | `Todo[]`       |
| POST   | `/todos`      | `{ title }`           | `Todo`         |
| PATCH  | `/todos/{id}` | `{ completed }`       | `Todo`         |
| DELETE | `/todos/{id}` | —                     | `204`          |

`Todo` = `{ id: number, title: string, completed: boolean }`.

## Deployment

Pushing to `master` triggers the [GitHub Actions workflow](.github/workflows/deploy.yml),
which runs `next build` (static export to `out/`) and publishes to GitHub Pages.

1. In the repo settings, set **Pages → Build and deployment → Source** to
   **GitHub Actions**.
2. (Optional) Add a repository variable `NEXT_PUBLIC_API_URL` pointing at your
   deployed backend so the production build uses it.

The site is served under `/Anomaly-Dashboard/` (configured via `basePath` in
[`next.config.ts`](next.config.ts)).
