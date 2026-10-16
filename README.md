# Sai Sumedh Kaveti — portfolio

Source for **https://saisumedhkaveti.work/**, my software engineering portfolio.

Built with React, TypeScript, and Vite. It's a static site with no backend and no tracking; the Bricolage Grotesque font is self-hosted from npm, the hero is a 3D valley built in code with Three.js, and the Resume button and highlight glows use the MIT-licensed `metal-fx` and `border-beam` effects from libraries.dev. It works at phone widths and with a keyboard.

## Projects featured

| Project | What it shows | Demo | Source |
|---|---|---|---|
| **FinSight** | Redis caching that stays correct after writes, idempotent background CSV imports (BullMQ) | [Live](https://sai-finsight-demo.onrender.com) | [GitHub](https://github.com/SaiSumedh18/finsight) |
| **TaskFlow** | Java 21 / Spring Boot API with membership-based authorization and row locking | [Live](https://sai-taskflow-demo.onrender.com) | [GitHub](https://github.com/SaiSumedh18/taskflow) |
| **InsightChat AI** | Grounded AI analytics: numbers computed in code, streamed answers, bounded context | [Live](https://sai-insightchat-demo.onrender.com) | [GitHub](https://github.com/SaiSumedh18/insightchat-ai) |
| **FORM / 65** | Scroll-driven keyboard configurator with shareable builds | [Live](https://saisumedh18.github.io/form65/) | [GitHub](https://github.com/SaiSumedh18/form65) |
| **Create Daily** | Creative coding: a procedurally folded origami koi in Three.js that follows your cursor | [Live](https://saisumedh18.github.io/create-daily/) | [GitHub](https://github.com/SaiSumedh18/create-daily) |

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

- `src/App.tsx`: page layout, stack, how-I-work steps, contact and keyboard shortcuts
- `src/ValleyHero.tsx`: the hero; shows the 3D valley, or the illustrated one if WebGL isn't available
- `src/three/Valley.tsx`: the 3D dusk valley (Three.js / React Three Fiber, all built in code)
- `src/Hero.tsx`: the illustrated dusk scene, used as the fallback
- `src/Story.tsx`: the scroll-lit “How I got here” story
- `src/Journey.tsx`: the journey map stops
- `src/Work.tsx`: project cards and case-study popups
- `src/styles.css`: styling
- `public/`: resume PDF, project screenshots, favicon
- `index.html`: page title, description, social preview tags

## Deployment

Pushing to `main` runs `.github/workflows/pages.yml`, which lints, builds, and deploys the site. `render.yaml` defines the free Render services that host the three project demos, all following their repositories’ `main` branches. Database credentials live in the hosting dashboards, never in this repo.
