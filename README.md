# OpsPilot

OpsPilot is a self-directed portfolio project that models a small-business internal operations dashboard. It gives a demo operations team one place to manage customers, orders/campaigns, inventory/assets, issues, and reports.

The app is built to feel like practical internal software: dashboard-first, form-heavy, table-driven, and backed by realistic demo seed data.

## Status

OpsPilot is implemented and tested locally. Deployment is still in progress.

- Local app shell and demo sign-in are implemented.
- Customer, order/campaign, inventory, issue, dashboard, and report workflows are implemented.
- PostgreSQL schema, Prisma migration, and demo seed data are included.
- Unit and browser tests cover the main demo workflows.
- Live demo URL: not deployed yet.

## Demo Account

The login page is prefilled with the demo credentials:

```text
Email: olivia.chen@opspilot-demo.test
Password: opspilot-demo
```

This is demo-only authentication for a portfolio case-study project, not a production identity system.

## Features

- Dashboard metrics for active customers, open work, overdue orders, high-priority issues, low-stock inventory, and weekly completions.
- Customer CRUD with owners, contact details, status, search, filters, detail pages, edit forms, and archive behavior.
- Order/campaign CRUD with customer relationships, priority, due dates, owners, estimated value, filters, detail pages, and archive behavior.
- Inventory/asset CRUD with categories, quantity, low-stock thresholds, assignments, status tracking, filters, and archive behavior.
- Issue/ticket CRUD with categories, priority, status, related customers/orders, resolution notes, resolve/reopen/close behavior, filters, and archive behavior.
- Reports page for orders, issues, and inventory with filtered CSV export.
- Loading, empty, error, success, and validation states for core flows.
- Seed data for fictional customers, work items, inventory, issues, activity events, and team members.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Prisma 7
- PostgreSQL
- Zod
- Vitest
- Playwright

## Local Setup

Requirements:

- Node.js
- npm
- PostgreSQL database

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to a local, Neon, Supabase, or other PostgreSQL connection string.

Generate the Prisma client:

```bash
npm run db:generate
```

Apply the database migration:

```bash
npx prisma migrate dev
```

Seed the demo data:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev          # start Next.js locally
npm run prebuild     # generate the Prisma client
npm run build        # generate Prisma client and create a production build
npm run start        # start the production server
npm run lint         # run ESLint
npm run typecheck    # run TypeScript checks
npm test             # run unit tests
npm run test:e2e     # run Playwright browser tests
npm run db:generate  # generate the Prisma client manually
npm run db:seed      # reset and seed demo data
```

## Verification

Latest local verification:

```text
npm run typecheck  # passed
npm run lint       # passed
npm test           # 19 files, 89 tests passed
npm run test:e2e   # 22 tests passed
```

The Playwright suite starts the app, signs in with the demo account, checks dashboard/report behavior, and exercises the core CRUD workflows.

## Deployment Notes

Deployment is planned for Vercel with a hosted PostgreSQL database such as Neon or Supabase.

Expected deployment steps:

1. Create a hosted PostgreSQL database.
2. Add `DATABASE_URL` to the deployment environment.
3. Run `npm run db:generate`.
4. Run `npx prisma migrate deploy`.
5. Run `npm run db:seed` against the deployed database.
6. Deploy the Next.js app.
7. Verify demo login, dashboard metrics, CRUD flows, and CSV export in the live environment.

## Project Framing

OpsPilot uses fictional seed data only. It should be described as a self-directed portfolio project or case-study project, not as client work, employment, freelance work, or production work.
