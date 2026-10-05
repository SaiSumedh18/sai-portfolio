# Sai Sumedh Kaveti — personal portfolio

A responsive, accessible React / TypeScript / Vite website with no tracking, external fonts, backend, or credentials.

## Run

Use Node.js 22.12+ or 24+.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173). A preview was also started at http://127.0.0.1:5178 during delivery.

```sh
npm run lint
npm run build
npm run preview
```

`dist/` contains the static production site. Relative asset paths support subdirectory hosting. Do not open the source index.html directly from the filesystem.

## Content and verification

- Profile and education: supplied user details, including NC State GPA 3.72/4.0.
- Current resume: `/Users/saisumedh/Desktop/MS Resume/Kaveti Sai Sumedh Resume.pdf`, explicitly supplied by the user. Copied without alteration to `public/Sai-Sumedh-Kaveti-Resume.pdf`. Teaching role, coursework, expanded skills, and INCOIS metrics follow this resume. Internship outcome metrics are resume claims, not independently rerun experiments. Prior Prodigy experience is retained from the earlier resume. Newer verified project architecture remains on the website even where this PDF lists earlier implementations.
- Projects: local upgraded repos under `/Users/saisumedh/Documents/Codex/2026-10-03/referenced-chatgpt-conversation-this-is-an-2/work/projects/`. Architecture and measurements follow README upgrade sections and checked implementation files. All benchmark claims are labeled local/synthetic with scope notes.
- Original application screenshots copied from those repos; no fabricated interface or stock portrait.
- FinSight: local k6 dashboard p95 18.8815 ms without cache / 3.121 ms with warm cache; 10,000 synthetic transactions, 10 VUs, one paired comparison. No cloud performance or AWS deployment is claimed.
- TaskFlow: Java 21 / Spring backend exists in local `spring-server`; Render frontend URL returned HTTP 200 and app HTML on Oct 4, 2026. Its Sept 17 deployment predates the Spring upgrade, so the card distinguishes the public demo from the new backend. Demo frontend availability is verified; authenticated backend workflows were not tested.
- InsightChat: 80.15–94.09% reduction in locally estimated evidence tokens on three question fixtures, excluding instructions/history/output. No measured live-model accuracy, billing, or cost savings are claimed.
- InsightChat's documented repository URL returns public HTTP 404 and is absent from the public profile API listing. Its website button therefore points to the working GitHub profile. Replace it with the repository URL when public access is available. No repository visibility was changed.

Validation: lint and production build passed; no runtime browser errors; all images/PDF return 200; all local section anchors resolve; navigation remains visible without a menu; no horizontal overflow at 320, 390, and 768 CSS pixels. Desktop/mobile screenshots are `desktop.png` and `mobile.png`.

## Exact external links included

- Email: `mailto:saisumedhkaveti@gmail.com`
- Phone: `tel:+19843182047`
- LinkedIn: https://www.linkedin.com/in/saisumedhkaveti/ (supplied profile URL; not authenticated)
- GitHub profile: https://github.com/SaiSumedh18
- FinSight source: https://github.com/SaiSumedh18/finsight (public HTTP 200)
- TaskFlow source: https://github.com/SaiSumedh18/taskflow (public HTTP 200)
- TaskFlow Live Demo: https://taskflow-1cd4.onrender.com (HTTP 200 application HTML)
- Resume asset: `Sai-Sumedh-Kaveti-Resume.pdf`, relative to the deployed site's base path

No verified public demos found for FinSight or InsightChat AI, so those cards contain no demo buttons. InsightChat intended source is https://github.com/SaiSumedh18/insightchat-ai, currently unavailable publicly and deliberately excluded as a clickable destination.

## Deployment recommendation: Vercel

Use Vercel's Vite preset, `npm run build`, output directory `dist`, and no environment variables. See https://vercel.com/docs/frameworks/frontend/vite . Once the destination is approved, a dedicated GitHub repository can be created/pushed and imported into the chosen Vercel account/project. The source does not require paid backend resources.

Approval needed before publishing: choose the GitHub repository destination and Vercel account/project. Git initialization is deferred until a repository destination is selected; no commits, pushes, or deployment were performed.

## Edit

`src/App.tsx` contains profile, links, projects, and section content. `src/styles.css` contains responsive styling. `public/` contains the resume, project screenshots, and favicon. Update title/description in `index.html`; add a canonical/og:url only after a real final deployment URL is known.

## Final review — October 5, 2026

The final design puts projects directly after the hero, with a real FinSight preview, clear local-result labels, expandable architecture/method notes, and keyboard-accessible enlarged screenshots. Native dialog supports Escape, initial close-button focus, and focus return. Coursework is expandable; the teaching role highlights student count and weekly support. No push, repository creation, DNS edit, or deployment is authorized by this final review request.

Final review screenshots: `final-desktop.jpg` and `final-mobile.jpg`. These review assets are ignored by Git. `vercel.json` supplies the Vite build/output settings for later deployment approval. No canonical URL is configured because the registered custom domain is not yet connected to a deployment.

Validation: lint/build pass; browser console has no warnings/errors; 320/390/768 px widths have no horizontal overflow; navigation remains visible without a menu; project notes expand/collapse; screenshot dialog opens and closes with Escape; section anchors resolve; current resume returns HTTP 200.

October 5 refinement: corrected LinkedIn to the verified public profile /in/saisumedhkaveti/; navigation stays visible at all widths, with no menu toggle; school placeholder badges and footer monogram removed; experience and education use continuous layouts.

## Reference-informed polish

Reviewed Brittany Chiang (https://brittanychiang.com/), Lee Robinson (https://leerob.com/), and Josh Comeau (https://www.joshwcomeau.com/) for clear hierarchy, concise writing, and thoughtful interaction details. Content and layout remain specific to Sai. Skill groups now use technology/category icons from react-icons; social marks use recognizable GitHub/LinkedIn icons plus an email envelope. Degree imagery is generic graduation iconography, not a fabricated university logo. Experience dates are 16px and education dates 14px; footer uses a personal signature, location, and social links. Navigation remains visible and now highlights the section in view. Sticky-header anchor offsets are provided. Resume controls have increased padding and a separate layout column on desktop.

Review screenshots: skills-refined.jpg and education-refined.jpg. All review screenshots should stay out of the eventual source commit. No repository creation, pushes, publishing, or DNS changes performed.

## Public release — October 5, 2026

The user approved public publishing. Source is now at https://github.com/SaiSumedh18/sai-portfolio and GitHub Pages is live at https://saisumedh18.github.io/sai-portfolio/ . The Publish portfolio workflow lints, builds, and deploys updates pushed to main. Earlier review notes describing deferred publishing are historical. The final approved palette is charcoal, white, and blue. No custom domain DNS was modified.

FinSight and TaskFlow links point to their verified upgrade branches so visitors see the architecture described by the portfolio. InsightChat remains private; public hosting does not require exposing its source. Full project hosting remains pending hosting-account sign-in, database allocation, and free-tier configuration.
