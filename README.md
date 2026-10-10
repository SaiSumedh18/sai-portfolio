# Sai Sumedh Kaveti — portfolio

Source for **https://saisumedhkaveti.work/**, my software engineering portfolio.

Built with React, TypeScript, and Vite. It's a static site with no backend, no tracking, and no external fonts. It works at phone widths and with a keyboard.

## Projects featured

| Project | What it shows | Demo | Source |
|---|---|---|---|
| **FinSight** | Redis caching that stays correct after writes, idempotent background CSV imports (BullMQ) | [Live](https://sai-finsight-demo.onrender.com) | [GitHub](https://github.com/SaiSumedh18/finsight) |
| **TaskFlow** | Java 21 / Spring Boot API with membership-based authorization and row locking | [Live](https://sai-taskflow-demo.onrender.com) | [GitHub](https://github.com/SaiSumedh18/taskflow) |
| **InsightChat AI** | Grounded AI analytics: numbers computed in code, streamed answers, bounded context | [Live](https://sai-insightchat-demo.onrender.com) | Private |

Demos run on free hosting and can take about a minute to wake up.

## Run locally

Requires Node.js 22.12+.

```sh
npm ci
npm run dev       # http://127.0.0.1:5173
npm run lint
npm run build     # static site in dist/
```

## Editing

- `src/App.tsx`: all content (profile, projects, experience, skills, education)
- `src/styles.css`: styling
- `public/`: resume PDF, project screenshots, favicon
- `index.html`: page title, description, social preview tags

## Deployment

Pushing to `main` runs `.github/workflows/pages.yml`, which lints, builds, and deploys the site. `render.yaml` defines the free Render services that host the three project demos, all following their repositories’ `main` branches. Database credentials live in the hosting dashboards, never in this repo.
