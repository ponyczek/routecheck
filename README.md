[4 tools called]

<readme_planning>
Key points from PRD:
- Product: RouteLog MVP — SaaS for transport companies collecting standardized daily driver reports via single-use email links with AI summaries and risk staging.
- Functional requirements cover authentication, driver CRUD, daily tokenized links, public report form (OK vs Problem paths), 10-minute post-submit edit, AI-generated summaries with risk levels/tags, dashboards (Today + 7-day history), email alerts, CSV export, telemetry, CI pipeline.
- Boundaries exclude telematics/TMS integrations, SMS/native apps, attachments, multi-tenant roles, payments, advanced BI, legacy browser support, >7-day UI history.
- Extensive user stories detailing flows; metrics establish success criteria (conversion, call reduction, risk detection, export usage, UX timing, reliability, CI health).

Key points from tech stack doc:
- Frontend: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui.
- Backend: Supabase (PostgreSQL, auth, SDK).
- AI: Openrouter.ai integrations for summaries.
- CI/CD & hosting: GitHub Actions, DigitalOcean with Docker deployment.

Key points from dependencies (.nvmrc, package.json):
- Node version: 22.14.0.
- Project name currently `10x-astro-starter`, version 0.0.1.
- Scripts: dev/build/preview/astro, lint/lint:fix, format.
- Dependencies align with Astro 5, React 19, Tailwind 4, shadcn ecosystem.
- Dev tooling: ESLint (with Astro, React, TS plugins), Prettier, Husky, lint-staged.

README section outline:
1. Project name — introduce RouteLog MVP (working title RouteCheck).
2. Project description — concise paragraph summarizing goal, audience, key capabilities.
3. Tech stack — bullet list by layer (frontend, backend, AI, DevOps) referencing docs.
4. Getting started locally — prerequisites, install steps, environment notes, scripts to run dev/build.
5. Available scripts — table or list translating package.json scripts.
6. Project scope — summarize functional requirements plus out-of-scope list; reference PRD.
7. Project status — current stage (MVP planning), highlight metrics/goals, link to PRD.
8. License — note unspecified status; instruct to define later.

Missing information:
- Specific environment variables or Supabase setup instructions.
- Actual repository URL and deployment endpoints.
- Confirmed license; currently unspecified.
</readme_planning>

## RouteLog MVP

![Status](https://img.shields.io/badge/status-MVP%20planning-yellow) ![Node](https://img.shields.io/badge/node-22.14.0-43853d)

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description
RouteLog is a lightweight SaaS platform that helps small and mid-sized transport companies collect standardized daily reports from drivers. Each driver receives a single-use email link, submits a one-click “All OK” update or a more detailed problem report, and the system generates an AI-powered summary with a risk rating for dispatchers. Dispatchers gain a live “Today” dashboard, a rolling seven-day history, and CSV export tools geared toward high conversion from link to full report.

## Tech Stack
- **Frontend:** Astro 5, React 19, TypeScript 5 for hybrid static/dynamic UI, Tailwind CSS 4 and Shadcn/ui components for accessible styling.
- **Backend & Data:** Supabase providing PostgreSQL, authentication, and SDKs that power driver management, tokenized links, and storage.
- **AI Services:** Openrouter.ai models generate 2–3 sentence Polish summaries, risk levels, and controlled cause tags after each submission.
- **Tooling & DevOps:** ESLint + Prettier with lint-staged and Husky pre-commit hooks, GitHub Actions for CI, DigitalOcean Docker-based deployment.

Additional documentation: see the full product requirements in `.ai/prd.md` and technology overview in `.ai/tech-stack.md`.

## Getting Started Locally
1. **Prerequisites**
   - Install Node.js `22.14.0` (see `.nvmrc`). Use `nvm use` if available.
   - Ensure `npm` ships with your Node installation.

2. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd routecheck
   npm install
   ```

3. **Run in Development**
   ```bash
   npm run dev
   ```
   This starts the Astro dev server with hot reload.

4. **Build for Production**
   ```bash
   npm run build
   ```
   Preview the static output locally with `npm run preview`.

> Configuration: Supabase keys, AI provider credentials, and email delivery settings are not yet defined and must be added before end-to-end functionality works.

## Available Scripts
- `npm run dev` — start the Astro development server.
- `npm run build` — generate the production build.
- `npm run preview` — serve the built output locally.
- `npm run astro` — run arbitrary Astro CLI commands.
- `npm run lint` — run ESLint across the project.
- `npm run lint:fix` — attempt automatic ESLint fixes.
- `npm run format` — format supported files with Prettier.

## Project Scope
**In scope (MVP requirements):**
- Shared-company authentication with registrational flow.
- CRUD management for drivers with vehicle number uniqueness.
- Daily cron-driven emails dispatching 24-hour single-use tokens.
- Public report form with happy-path “All OK” shortcut and problem workflow capturing delays, reasons, damages, blockers, and partial completion.
- Ten-minute self-edit window for drivers with regenerated AI summaries.
- AI-generated Polish summaries, four-level risk classifications, and controlled cause tagging.
- Dispatcher-facing Today dashboard (auto-refresh) with pending section and risk badges.
- Seven-day history view with sorting/filtering and detailed drill-down.
- Manual dispatcher report entry, mirrored to AI pipeline and audit logs.
- Email alert when expected reports are missing after 24 hours.
- CSV export by date range, containing form fields and AI outputs.
- Telemetry of form completion time and link conversion (PII-free).
- GitHub Actions CI workflow running at least one automated test per push or PR.

**Out of scope (per product boundaries):**
- Telematics/TMS integrations.
- SMS or native mobile apps.
- File attachments, signatures, or geolocation.
- Multi-tenant roles, payments, or advanced analytics dashboards.
- Browser support beyond the two latest versions of modern mobile browsers.
- UI access to history older than seven days (available via CSV/database only).

## Project Status
- **Stage:** MVP planning and early implementation.
- **Key success metrics:** ≥70% link-to-report conversion within 24h, ≥30% reduction in evening status calls within two pilot weeks, sustained detection of medium+ risk reports, weekly CSV exports, median form completion under 90s, 99% 2xx HTTP stability, always-green CI pipeline.
- **Next steps:** Finalize Supabase schema, implement email cron and token lifecycle, wire AI summarization via Openrouter, build dispatcher dashboards, configure telemetry, and automate CI workflows.

Refer to `.ai/prd.md` for detailed user stories (US-001 – US-020) and acceptance criteria.

## License
License information is not yet specified. Define and add a `LICENSE` file before release.