# Seed data

The CDC scraper writes an ignored `cdc-milestones-candidate.json` here and
never overwrites approved data. Diff it with `npm run content:cdc:diff`, review
every change, then run `npm run content:cdc:approve -- --approve
--reviewer="Name" --reviewed-at=YYYY-MM-DD`. That explicit step replaces
`cdc-milestones-raw.json` and records `cdc-milestones-review.json`.

`cdc-neutral-overrides.json` holds exact reviewed neutral wording separately
from source records. `emergence-windows.json` holds the six WHO percentile
windows and the documented CDC checkpoint-interval rule. WHO motor data and
reviewed guidance sit beside them. Guidance entries are short, independently
written summaries with canonical links; they are not copied article text.

The seed command intentionally stops when the CDC output is missing. It never
generates or guesses public-health milestone wording.
