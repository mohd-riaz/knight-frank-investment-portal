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

`npm run db:setup` applies committed Prisma migrations and seeds 59 properties extracted from the October 2024 Private Office Commercial Opportunity Tracker, 413 copies for the seven missing regions (472 records total), and the demo investor. Seeding is repeatable: it refreshes these catalog records by stable ID while preserving unrelated properties, investor shortlists, requests and accounts. Older fictional properties already in a database are preserved; a fresh database contains only the new catalog. If `DEMO_EMAIL` or `DEMO_PASSWORD` is customized before the first seed, use those credentials at sign-in. Changing these values later does not reset an existing account.

`npm run db:down` stops the database while preserving its named volume. Next.js runs on the host; Docker Compose runs PostgreSQL only.

## Included behavior

- Better Auth email/password login, database sessions, server-side route protection, sign-out, and database-backed sign-in rate limits. Public sign-up is disabled for this private portal.
- Global overview, all eight regions and seven asset classes, property details, currency-aware price filtering, yield/tenure filters, sorting, card/table views, and empty states.
- Regions, countries, and asset classes support searchable multi-selection. Filters use OR within each group and AND across groups. Listing URLs persist all active filters through refresh, browser history, sharing, and sign-in; repeated parameters preserve asset names containing commas. Countries are constrained to the selected regions. Clearing filters removes their URL parameters.
- Investor-specific shortlists persisted through Prisma, comparison of two or three properties, and four conversational search examples.
- Comparison selections are remembered per investor in browser localStorage. Opening `/compare` puts the selection in the URL; shared `?ids=oct24-7-old-park-lane,oct24-88-jermyn-street` links override the saved selection and survive sign-in. The comparison page includes a Copy link button. Only available property IDs are retained, with duplicates removed and a three-property limit; Clear resets the selection and URL.
- Enquiries and document-access requests validated on the server and saved with a pending status. Each record belongs to the authenticated investor.
- Both request dialogs use the signed-in investor's account email by default and display it in a contact note. Investors can optionally choose a different contact email for the request without changing their account.
- Non-confidential opportunities offer an immediate sample IM PDF download through an authenticated endpoint. Confidential opportunities require an access request instead; pending requests remain visible after refresh and are scoped to the investor. Requesting access does not grant download permission. The shared PDF is clearly labelled as an illustrative sample and is stored outside public assets.
- Accessible shadcn/Radix dialogs, tabs, selects, checkboxes, loading states, form feedback, mobile navigation, and reduced-motion support.

The catalog is a historical October 2024 UK dataset, including two sold auction lots. Availability has not been revalidated. Regional copies use assigned city/country pairs consistent with their region (for example, Dubai / United Arab Emirates in Middle East). These are demonstration locations, not actual listings in those markets. The original UK source records, photographs, GBP currency and financial metrics are retained. Location assignments are defined in `src/lib/regional-locations.ts` and are applied by the shared catalog and seed. The assistant uses Gemini through OpenRouter when a server API key is configured; without a key it displays a connection notice. The original deterministic interpreter remains only for legacy tests. Requests do not send email, grant document access, or execute an NDA. Password recovery, real investment documents, and advisor administration are not connected.

## Imported dataset

- `data/october-2024-source.json` preserves the extracted text for all 59 listing panels on PDF pages 3–22, with page/column references and the source file SHA-256.
- `src/datasets/october-2024.json` contains 59 reviewed properties. The duplicate 18 Glebe Road listing is merged with both references; Jellicoe House and Vanbrugh House are separate records because they have separate prices, areas and rents.
- `src/data.ts` supplies the same catalog to the portal and Prisma seed, and generates copies for missing regions with stable unique IDs. Listing presentation omits demo suffixes, import-date badges, and source extraction notes; provenance remains in the source files and this documentation.
- Prices are stored in GBP millions. Floor areas use square metres, rounded from reported square feet (× 0.09290304); beds, apartments and land acreage are not treated as floor area. Original sizes and measurement bases remain in the highlights.
- Missing values stay null. The malformed prices for Meadowside House (`£9,00,000`) and Atrium Court (`£13,000,00`), Hamilton Terrace's conflicting areas, and Beach House's area range are flagged instead of silently guessed.
- Sold prices, guide prices and starting prices retain qualifiers in the reviewed source. The portal displays numeric amounts without prefixes and uses “On application” for unknown prices; sold listings keep their status badge. Annual income uses reported rent or net operating income in GBP, not price × yield; estimated rental values remain in the notes. Residential is a separate asset class. Source classification notes remain in the reviewed JSON.

To reproduce the raw extraction with Python and `pdfplumber` installed:

```powershell
python scripts/extract-opportunities.py "C:\path\to\Private Office Commercial Opportunity Tracker - October 2024.pdf"
```

To extract and relink the original property photos (requires `pdfplumber`, `pypdf` and Pillow):

```powershell
python scripts/extract-opportunity-images.py "C:\path\to\Private Office Commercial Opportunity Tracker - October 2024.pdf"
npm run db:seed
```

The script verifies the source PDF hash, matches embedded images to listing columns, and writes 58 photographs to `public/assets/images/october-2024`. Jellicoe House and Vanbrugh House share the joint panel photo. The image manifest in `src/datasets/october-2024-images.json` records page/column references, dimensions and checksums. Cards, detail pages and comparisons use each photo’s original dimensions.

The reviewed JSON is deliberately maintained separately from raw extraction so source ambiguities and the split/merged listings remain explicit. The original PDF is not served publicly by the application.

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

## AI assistant setup

Add `OPENROUTER_API_KEY` to the root `.env` for local use, or to your hosting provider's server environment for deployment. Create the key at https://openrouter.ai/settings/keys and keep it out of source control and chat. Restart the app after configuring it. `OPENROUTER_MODEL` defaults to `google/gemini-3.5-flash-lite`; an override must support strict JSON structured outputs. Set an OpenRouter key spending cap for the assessment.

The authenticated `/api/assistant` endpoint makes one structured model call to interpret the message and previous search state, validates the complete plan with Zod, and executes a bounded Prisma query. A second call explains the returned records. Cards and comparison IDs always come from PostgreSQL. Follow-up context stays in the browser for the current mounted portal session; Start a new conversation clears it. No chat-history migration or extra dependency is required.

Supported searches cover region, country, asset class, city/name text, currency, price range in millions, minimum yield, tenure, and price/yield sorting. The assistant can compare up to three records or answer questions about previously displayed records. Unsupported criteria or ambiguous budgets should prompt clarification. It does not convert currencies, infer missing financial metrics, or search investment documents. Confidential and sold records are excluded; regional copies are identified as sample locations and the chat explains that availability is unverified.

The server enforces same-origin requests, authenticated sessions, a 40 KB body limit, bounded history/results, a 45-second provider deadline, and atomic database-backed quotas of 10 messages per minute and 100 per UTC day per investor. There are two model stages per successful search. Interpretation allows up to three retries (four attempts), and explanation allows one retry (two attempts). Temporary network failures and HTTP 408/429/500/502/503/504 responses retry after roughly 1, 2 and 4 seconds with jitter, respecting a longer Retry-After header. All attempts share the 45-second deadline and stop on cancellation; waits that cannot fit are skipped. Invalid credentials, insufficient credits, invalid requests and malformed AI output do not retry. A message can therefore make up to six provider attempts, potentially increasing costs, while consuming one investor quota slot. Quota failures and provider errors are shown in the chat. If only the explanation fails, retrieved cards remain available. Generated prose is grounded by the prompt but is not a guarantee against model errors; exact figures should be read from the cards.

Run `npm test` for schema, query and mocked-provider checks. After `npm run build`, with PostgreSQL running, use `npm run test:assistant:integration`. This starts an isolated production server on port 3101 with a mocked OpenRouter transport, checks the real authenticated route, database results, follow-ups and concurrent request limits, then removes its temporary records. It never calls or charges a live provider. After supplying a real key, manually verify the four example searches, a follow-up such as “only freehold”, and an ambiguous currency question before presenting.

## Asset credits

The interface uses Knight Frank's public logo and web fonts plus local copies of Unsplash photographs. Imported opportunities use the corresponding original photographs extracted from the supplied October 2024 tracker. The generic category and London hero images remain from Unsplash. Regional copies reuse their source opportunity’s photo. The original shadcn license is retained in `src/components/ui/LICENSE.md`.

This is a local demonstration, not an official published Knight Frank service.

## License

Copyright © 2026 Mohammed Riaz. All rights reserved.

This project was developed as part of a technical assessment.
The source code is publicly available for evaluation and
portfolio purposes only.

No permission is granted to reproduce, modify, distribute,
or commercially use this project without prior written consent.
