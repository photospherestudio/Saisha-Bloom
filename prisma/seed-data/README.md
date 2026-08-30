# Seed data

Place the reviewed output of `prisma/scrape-cdc-milestones.mjs` here as
`cdc-milestones-raw.json`. `who-motor-milestones.json` and `guidance.json` are
also included. Guidance entries are short, independently written summaries
with canonical links; they are not copied article text.

The seed command intentionally stops when the CDC output is missing. It never
generates or guesses public-health milestone wording.
