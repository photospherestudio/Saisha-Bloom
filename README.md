# Milestones

Calm, source-led child development tracker. Current tracker covers all four CDC domains from 2 months through 48 months.

## Run locally

```bash
npm install
npm run supabase:start
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Local Supabase uses ports 54421–54429 so it can run beside other local projects. Create `.env` with `DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54422/postgres"`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the server-only `SUPABASE_SECRET_KEY`. For email invites and reminders also set `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, and `CRON_SECRET`. Keep the `milestone-memories` bucket private. Use `npm run db:migrate` for deployed databases; if an existing database already contains the original schema, mark `20260830000000_initial_schema` as applied once before deploying later migrations. Do not use `db:push` in production.

Auth protects `/dashboard` and `/child/*`; unauthenticated users are sent to `/sign-in`. Optional height/weight fields use an age-only reference envelope from 12–48 months; they are not a diagnosis and do not require gender. The demo tracker works without a database at `/child/demo/checklist`.

The supplied CDC scraper writes reviewed output to `prisma/seed-data/cdc-milestones-raw.json`. WHO data lives beside it for seed-only motor reference. CDC publishes checkpoints rather than a record for every month; the tracker exposes every month from 12–48 and labels months between checkpoints with the latest available CDC checkpoint. Responses are stored as check-ins so weekly progress can be summarized. The demo tracker works without a database at `/child/demo/checklist`.

`prisma/seed-data/guidance.json` contains short, reviewed paraphrases from AAP, ZERO TO THREE, NHS Start for Life, Raising Children Network, and India’s RBSK. These are stored separately from milestone check-ins and age-matched activity guidance is used in the weekly feed.
