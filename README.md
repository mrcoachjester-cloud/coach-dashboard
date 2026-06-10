# coach-dashboard

Coach Dashboard — Next.js app.

Overview

This repository contains a Next.js application used for coach dashboards.

Quick start

- Install dependencies: `npm install`
- Run locally: `npm run dev`
- Build: `npm run build`

Deploy to Vercel

1. Sign in to Vercel and choose "Add New Project".
2. Import from GitHub and select the `mrcoachjester-cloud/coach-dashboard` repository.
3. Vercel will auto-detect Next.js. Set environment variables in the Vercel dashboard (for example, any Supabase keys in `.env.local`).

GitHub Actions (CI)

GitHub Actions are automated workflows that run on GitHub in response to events (push, pull request, schedule). They can run tests, build your app, and deploy.

This repo includes a basic CI workflow at `.github/workflows/node-ci.yml` which installs dependencies and builds the project on pushes and pull requests. Vercel's recommended deployment flow is to connect your GitHub repo directly to Vercel — that'll auto-deploy on pushes — but CI workflows are useful for running checks before deployment.

See `.github/workflows/node-ci.yml` for the configured steps.

Notes

- This project already contains a `.gitignore` to exclude `node_modules`, `.next`, and local env files.
- If you want automatic Vercel deployments triggered from GitHub Actions instead of Vercel's integration, I can add a deployment step.

License

Add a license as needed.
