# Knight Frank Investment Portal

A real estate investment portal built with Next.js App Router, TypeScript, shadcn/ui, Better Auth, Prisma, and PostgreSQL on Neon. Opportunity photographs and memoranda are stored in Neon Object Storage. Docker Compose remains available for local PostgreSQL. The interface includes Suisse/Tiempos fonts, photography, brand assets, and responsive layouts.

## Administration

Sign in at `/admin/login` to open `/admin` as an owner or administrator. The administration area reuses the investor portal’s branded sidebar, fonts, navigation controls, tables, dialogs and form components. Investor sign-in remains at `/login`; both pages use the existing authentication service, with admin permissions checked on the server.

- **Opportunities:** create and edit investment details, save drafts, preview, publish, upload photographs and an IM, mark confidentiality, archive and restore as a draft. Uploaded files are stored in private Neon Object Storage; PostgreSQL stores their URLs and object keys. Each file is limited to 10 MB. Identical file contents reuse one stored object, including uploads with different filenames. The latest uploaded photograph is the cover. Existing listings retain the labelled sample IM until an actual PDF is uploaded.
- **Requests:** review enquiries, approve document access after reviewing the NDA requirement, and decline or revoke access. Approvals apply only to the requesting investor and the selected property. This records an advisor’s review; it does not execute an electronic signature.
- **Users (owners only):** invite clients, admins and owners, reissue pending invitations, update roles, and deactivate/reactivate accepted accounts. Role or status changes invalidate existing sessions. The last active owner cannot be removed or demoted, and owners cannot deactivate themselves.
- **Invitations:** one-use links expire after seven days and let recipients set their own password. Only token hashes are stored. Reissuing invalidates earlier links. Email delivery is not connected: copy the generated private link and share it with its intended recipient.

The database seed creates a demo owner with **admin@example.com** / **KnightFrankAdmin2026!**. Override `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first seed to use different credentials. Run `npm run db:seed` for the full dataset, or `npm run db:seed:admin` to seed only the admin account. Repeat seeds preserve existing passwords, roles and disabled accounts. A pending admin invitation without a password is activated with the seed password and its invitation links are invalidated. A client account with the same email causes the seed to stop rather than being promoted.

`npm run admin:setup` remains available for creating an owner through a private invitation instead of seeded credentials. Existing accounts are left unchanged by that command.

Drafts and archived listings are excluded from investor browsing, AI search, shortlist additions and document downloads. Admin APIs check the database role on every request; public registration remains disabled.

The demo catalog marks **10 Throgmorton Avenue**, **Beaumont Shopping Centre**, and **Leonardo Heathrow Hotel**, plus their regional copies, confidential: 24 opportunities across eight regions. These are demonstration access settings, not confidentiality claims from the source tracker. Investors can view the listings, request document access, and download after an admin approves the request. New seeds create these defaults; repeat seeds preserve both enabled and disabled confidentiality settings chosen in admin. `npm run db:confidential-demo` explicitly enables the selected examples in an existing database; running it again re-enables those examples, so it is separate from the normal seed.

Run `npm run test:admin` against a running local portal for temporary-account integration coverage of role restrictions, draft/publish/archive behavior, uploads, document grants, one-use invitations and deactivation. `npm run test:integration` retains the investor checks. For optional browser verification, set `PLAYWRIGHT_PACKAGE` to an installed Playwright package and run `npx tsx scripts/admin-browser-check.ts`; `ADMIN_SCREENSHOT` controls its screenshot destination. These checks clean up their temporary accounts and records.

## Local setup

Use **Node.js 24 LTS** and Docker Desktop with Linux containers. The project includes `.nvmrc`. PostgreSQL binds to **127.0.0.1:5432**; this port must be free.

```powershell
node scripts/setup-env.mjs
npm ci
npm run db:up
npm run db:setup
npm run dev
```

Open [the local portal](http://127.0.0.1:3000). Investor and administration login forms start with empty email and password fields. Share demonstration credentials with reviewers separately.

The environment setup creates `.env` with a randomly generated Better Auth secret. Existing values are preserved. `.env` is ignored by Git; `.env.example` documents the settings. Use the same host and port as `BETTER_AUTH_URL` when opening the app.

`npm run db:setup` applies committed Prisma migrations and seeds 59 properties extracted from the October 2024 Private Office Commercial Opportunity Tracker, 413 copies for the seven missing regions (472 records total), and the demo investor. Seeding is repeatable: it refreshes these catalog records by stable ID while preserving unrelated properties, investor shortlists, requests and accounts. Older fictional properties already in a database are preserved; a fresh database contains only the new catalog. If `DEMO_EMAIL` or `DEMO_PASSWORD` is customized before the first seed, use those credentials at sign-in. Changing these values later does not reset an existing account.

`npm run db:down` stops the database while preserving its named volume. Next.js runs on the host; Docker Compose runs PostgreSQL only.

## Neon setup

The development workspace is linked to the **Riaz** organization (`org-falling-term-74282943`), project **knight-frank-investment-portal** (`dark-wind-63729095`), in **AWS Europe (Frankfurt)**. Open it in the [Neon Console](https://console.neon.tech/app/projects/dark-wind-63729095/).

Neon writes the pooled `DATABASE_URL`, direct `DATABASE_URL_UNPOOLED`, and `NEON_BRANCH` to the ignored `.env`. Application queries use the pooled connection; Prisma CLI migrations use the direct connection, with `DATABASE_URL` as the fallback for local PostgreSQL. The original local environment is preserved in the ignored `.env.before-neon` on the machine where setup ran. Its Docker database is unchanged.

The `opportunity-media` bucket is declared as private in `neon.ts`. Server-only `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, and `AWS_REGION` settings are pulled into the ignored `.env`. Set these same values in the server environment when deploying. Never prefix them with `NEXT_PUBLIC_`.

Run `neon deploy` to provision the bucket and `neon env pull -s object-storage` to refresh its settings. With the Neon environment configured, run `npm run db:setup` to apply the committed migrations and seed the demonstration dataset, then `npm run dev`. The seed preserves uploaded cover images and memoranda and references the existing shared objects. New Neon branches inherit the files with their database; a completely separate project needs the files imported before using the catalog. Local PostgreSQL also needs Neon storage credentials to serve opportunity media.

The 472 catalog opportunities reuse 58 unique photographs, one sample memorandum, and one shared placeholder photograph. Objects use `sha256/<file-content-hash>` keys, so regional copies and repeat uploads share the same file. URLs saved in PostgreSQL remain private storage URLs. Reads resolve the object on the active Neon branch.

Published cover photographs are public by URL and use Next.js Image Optimization on Vercel. `/api/property-images/<sha256>` verifies that a published opportunity references the object, then streams only image bytes from the private bucket. The source response and optimized variants can be cached for 30 days. Regional copies share one content URL, and replacing a cover changes its URL immediately. Previously published photos may remain accessible from caches after replacement or archival for the cache lifetime; publishing a cover is therefore a public release of that photograph. The optimizer accepts only query-free public-photo and static-asset paths, with six widths, one quality and WebP output to limit transformations. Responsive image sizes avoid downloading a full detail image for a thumbnail. No extra Vercel environment variable is needed; the existing server-only Neon storage settings are used on cache misses.

Draft and archived thumbnails use the authenticated `/api/properties/<id>/image` route directly, bypassing optimization. Its signed redirect and image retain a five-minute private browser cache. Unpublished-only photos are never served by the public route. The bucket itself remains private, and public delivery never returns storage credentials or signed redirects. Investment memoranda and other documents remain behind the existing authorization and confidential-document approval checks, with `private, no-store` responses. Errors are also uncached.

`npm run storage:migrate` transfers legacy PostgreSQL file bytes and local catalog images, verifies downloaded copies against their SHA-256 hashes, updates database references, and clears the migrated database bytes. The nullable legacy `Material.bytes` column is retained for migration compatibility; new uploads never write it. A private recovery copy is saved under ignored `.qa/storage-migration-backup`. The transfer is safe to repeat and also recognizes files extracted into `.qa/extracted-opportunity-images`. The migrated opportunity images and sample PDF are no longer shipped in `public/` or `documents/`. The branded London background remains a static interface asset.

Seeding initializes demo accounts; it does not copy existing local users, sessions, requests, shortlists, or uploads to Neon. The original local environment remains in `.env.before-neon`.

Neon agent skills are installed in `.agents/skills`. The ignored `.codex/config.toml` configures Neon's MCP server for this project using browser authentication. Restart Codex to load it and sign in when prompted. On another checkout, install the Neon CLI, sign in, and run:

```powershell
neon init -y --agent codex --org-id org-falling-term-74282943 --project-id dark-wind-63729095 --skill neon --skill neon-postgres --mcp-auth oauth --mcp-config-location project --mcp-project-scoped --no-config
```

## Included behavior

- Better Auth email/password login, database sessions, server-side route protection, sign-out, and database-backed sign-in rate limits. Public sign-up is disabled for this private portal.
- Global overview, all eight regions and seven asset classes, property details, currency-aware price filtering, yield/tenure filters, sorting, card/table views, and empty states.
- Regions, countries, and asset classes support searchable multi-selection. Filters use OR within each group and AND across groups. Listing URLs persist all active filters through refresh, browser history, sharing, and sign-in; repeated parameters preserve asset names containing commas. Countries are constrained to the selected regions. Clearing filters removes their URL parameters.
- Investor-specific shortlists persisted through Prisma, comparison of two or three properties, and four conversational search examples.
- Comparison selections are remembered per investor in browser localStorage. Opening `/compare` puts the selection in the URL; shared `?ids=oct24-7-old-park-lane,oct24-88-jermyn-street` links override the saved selection and survive sign-in. The comparison page includes a Copy link button. Only available property IDs are retained, with duplicates removed and a three-property limit; Clear resets the selection and URL.
- Enquiries and document-access requests validated on the server and saved with a pending status. Each record belongs to the authenticated investor.
- Both request dialogs use the signed-in investor's account email by default and display it in a contact note. Investors can optionally choose a different contact email for the request without changing their account.
- Non-confidential opportunities offer an immediate IM PDF download through an authenticated endpoint, using the shared illustrative sample until a real document is uploaded. Confidential opportunities require an access request instead; pending requests remain visible after refresh and are scoped to the investor. Requesting access does not grant download permission. PDFs are stored in the private Neon bucket.
- Accessible shadcn/Radix dialogs, tabs, selects, checkboxes, loading states, form feedback, mobile navigation, and reduced-motion support.

The catalog is a historical October 2024 UK dataset, including two sold auction lots. Availability has not been revalidated. Regional copies use assigned city/country pairs consistent with their region (for example, Dubai / United Arab Emirates in Middle East). These are demonstration locations, not actual listings in those markets. The original UK source records, photographs, GBP currency and financial metrics are retained. Location assignments are defined in `src/lib/regional-locations.ts` and are applied by the shared catalog and seed. The assistant uses Gemini through OpenRouter when a server API key is configured; without a key it displays a connection notice. The original deterministic interpreter remains only for legacy tests. Requests do not send email or execute an NDA. Advisors can grant document access through /admin. Password recovery and email delivery are not connected; administrators can upload investment documents.

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
npm run storage:migrate
npm run db:seed
```

The extraction script verifies the source PDF hash, matches embedded images to listing columns, and stages 58 photographs under ignored `.qa/extracted-opportunity-images/october-2024`. The storage migration uploads each unique photograph once. Jellicoe House and Vanbrugh House share the joint panel photo. The image manifest in `src/datasets/october-2024-images.json` records page/column references, dimensions and checksums. Cards, detail pages and comparisons use each photo’s original dimensions.

The reviewed JSON is deliberately maintained separately from raw extraction so source ambiguities and the split/merged listings remain explicit. The original PDF is not served publicly by the application.

## Project structure

- `src/app`: Next.js pages, authenticated layout, and API route handlers.
- `src/components/portal`: portal screens and domain components; `src/portal.tsx` keeps navigation, filters, and comparison state across routes.
- `src/components/ui`: shadcn components, including components generated through the shadcn CLI.
- `src/styles.css` and `src/layout-primitives.css`: shared visual tokens and responsive styling.
- `src/lib/auth.ts`, `auth-client.ts`, and `session.ts`: Better Auth configuration, client, and server authorization.
- `prisma/schema.prisma`, `prisma/migrations`, and `prisma/seed.ts`: typed relational models, generated migrations, and repeatable seed.
- `public/assets`: local fonts, logo, and the branded London background.
- `neon.ts`, `src/lib/object-storage.ts`: private bucket policy, content-based file reuse, signed image links, and streamed document downloads.

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
