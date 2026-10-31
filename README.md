# Knight Frank Investment Portal

A real estate investment portal built with Next.js App Router, TypeScript, shadcn/ui, Better Auth, Prisma, and local PostgreSQL through Docker Compose. The interface includes Suisse/Tiempos fonts, photography, brand assets, and responsive layouts.

## Run locally

Use **Node.js 24 LTS** and Docker Desktop with Linux containers. The project includes `.nvmrc`. PostgreSQL binds to **127.0.0.1:5432**; this port must be free.

```powershell
node scripts/setup-env.mjs
npm ci
npm run db:up
npm run db:setup
npm run dev
```

Open [the local portal](http://127.0.0.1:3000). The login form is prefilled with **investor@example.com** / **KnightFrank2026!**. Both fields remain editable.

The environment setup creates `.env` with a randomly generated Better Auth secret. Existing values are preserved. `.env` is ignored by Git; `.env.example` documents the settings. Use the same host and port as `BETTER_AUTH_URL` when opening the app.

`npm run db:setup` applies committed Prisma migrations and seeds the 14 fictional opportunities and demo investor. Seeding is repeatable and preserves existing data. If `DEMO_EMAIL` or `DEMO_PASSWORD` is customized before the first seed, use those credentials at sign-in. Changing these values later does not reset an existing account.

`npm run db:down` stops the database while preserving its named volume. Next.js runs on the host; Docker Compose runs PostgreSQL only.

## Included behavior

- Better Auth email/password login, database sessions, server-side route protection, sign-out, and database-backed sign-in rate limits. Public sign-up is disabled for this private portal.
- Global overview, all eight regions and six asset classes, property details, currency-aware price filtering, yield/tenure filters, sorting, card/table views, and empty states.
- Regions, countries, and asset classes support searchable multi-selection. Filters use OR within each group and AND across groups. Listing URLs persist all active filters through refresh, browser history, sharing, and sign-in; repeated parameters preserve asset names containing commas. Countries are constrained to the selected regions. Clearing filters removes their URL parameters.
- Investor-specific shortlists persisted through Prisma, comparison of two or three properties, and four conversational search examples.
- Comparison selections are remembered per investor in browser localStorage. Opening `/compare` puts the selection in the URL; shared `?ids=p01,p02` links override the saved selection and survive sign-in. The comparison page includes a Copy link button. Only available property IDs are retained, with duplicates removed and a three-property limit; Clear resets the selection and URL.
- Enquiries and document-access requests validated on the server and saved with a pending status. Each record belongs to the authenticated investor.
- Accessible shadcn/Radix dialogs, tabs, selects, checkboxes, loading states, form feedback, mobile navigation, and reduced-motion support.

The catalog is fictional sample data. The assistant is deterministic filtering, with no live AI provider. Requests do not send email, grant document access, or execute an NDA. Password recovery, real investment documents, and advisor administration are not connected.

## Project structure

- `src/app`: Next.js pages, authenticated layout, and API route handlers.
- `src/components/portal`: portal screens and domain components; `src/portal.tsx` keeps navigation, filters, and comparison state across routes.
- `src/components/ui`: shadcn components, including components generated through the shadcn CLI.
- `src/styles.css` and `src/layout-primitives.css`: shared visual tokens and responsive styling.
- `src/lib/auth.ts`, `auth-client.ts`, and `session.ts`: Better Auth configuration, client, and server authorization.
- `prisma/schema.prisma`, `prisma/migrations`, and `prisma/seed.ts`: typed relational models, generated migrations, and repeatable seed.
- `public/assets`: local fonts, logo, and photography.

The scaffold was generated using `create-next-app`. Prisma was initialized with `prisma init`, and Better Auth models were generated with its `auth generate` CLI before integrating the domain relations. Webpack is explicitly selected for development/build because the installed Next.js Turbopack CSS worker failed on this Windows environment.

## Development and checks

```powershell
npm run db:migrate -- --name describe_change
npm run db:studio
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

With the app running and the database seeded, run `npm run test:integration`. It creates temporary test investors and removes their records afterward. The checks cover authentication, denied cross-origin requests, route protection, shortlist persistence and account isolation, request validation, and sign-out revocation. `TEST_BASE_URL` can override the test URL.

## Asset credits

The interface uses Knight Frank's public logo and web fonts plus local copies of Unsplash photographs. Images illustrate asset categories and do not identify the fictional properties. The original shadcn license is retained in `src/components/ui/LICENSE.md`.

This is a local demonstration, not an official published Knight Frank service.

## License

Copyright © 2026 Mohammed Riaz. All rights reserved.

This project was developed as part of a technical assessment.
The source code is publicly available for evaluation and
portfolio purposes only.

No permission is granted to reproduce, modify, distribute,
or commercially use this project without prior written consent.
