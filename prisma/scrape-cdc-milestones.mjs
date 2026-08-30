// scrape-cdc-milestones.mjs
//
// Scrapes CDC's "Learn the Signs. Act Early." digital checklist pages
// (public domain content) into structured JSON for seeding your DB.
//
// Usage:
//   npm install cheerio
//   node scrape-cdc-milestones.mjs
//
// Output: cdc-milestones-raw.json
//
// IMPORTANT: Review the output manually before using it in production.
// This is a heuristic parser based on CDC's current markup (verified
// Aug 2026) — CDC updates these pages periodically, so re-run and diff
// occasionally, and inspect a page in browser devtools if the parser
// returns 0 results for any age (their markup may have changed).

import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// Pulled directly from cdc.gov/act-early/digital-online-checklist/index.html
const AGE_URLS = {
  2: 'https://www.cdc.gov/act-early/digital-online-checklist/2-months.html',
  4: 'https://www.cdc.gov/act-early/digital-online-checklist/4-months.html',
  6: 'https://www.cdc.gov/act-early/digital-online-checklist/6-months.html',
  9: 'https://www.cdc.gov/act-early/digital-online-checklist/9-months.html',
  12: 'https://www.cdc.gov/act-early/digital-online-checklist/1-year.html',
  15: 'https://www.cdc.gov/act-early/digital-online-checklist/15-months.html',
  18: 'https://www.cdc.gov/act-early/digital-online-checklist/18-months.html',
  24: 'https://www.cdc.gov/act-early/digital-online-checklist/2-years.html',
  30: 'https://www.cdc.gov/act-early/digital-online-checklist/30-months.html',
  36: 'https://www.cdc.gov/act-early/digital-online-checklist/3-years.html',
  48: 'https://www.cdc.gov/act-early/digital-online-checklist/4-years.html',
  60: 'https://www.cdc.gov/act-early/digital-online-checklist/5-years.html',
};

// CDC's four domain headings (as h3s on each checklist page)
const DOMAIN_PREFIXES = [
  'Social/Emotional',
  'Language/Communication',
  'Cognitive', // covers "Cognitive (learning, thinking, problem-solving)"
  'Movement/Physical Development',
];

const USER_AGENT =
  'PhotosphereMilestoneBot/1.0 (+contact: you@yourdomain.com; ' +
  'building parent milestone app, using CDC public-domain content, ' +
  'polite/rate-limited crawl)';

function isDomainHeading(text) {
  return DOMAIN_PREFIXES.some((p) => text.trim().startsWith(p));
}

async function fetchPage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function parseAgePage(html, ageMonths, sourceUrl) {
  const $ = cheerio.load(html);
  const milestones = [];
  let currentDomain = null;

  // Walk elements in document order within the main content region.
  // CDC wraps the checklist body in the main content area; falling
  // back to 'body' is safe since we filter by heading text anyway.
  const $scope = $('#content').length ? $('#content') : $('body');

  $scope.find('h3, strong, b').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (!text) return;

    if (tag === 'h3') {
      if (isDomainHeading(text)) currentDomain = text;
      return;
    }

    // CDC marks each required checklist item with a trailing " *"
    if (currentDomain && /\*\s*$/.test(text)) {
      const milestoneText = text.replace(/\s*\*\s*$/, '').trim();
      // Filter obviously-wrong captures (nav labels, form field labels, etc.)
      const looksReal =
        milestoneText.length > 5 &&
        milestoneText.length < 200 &&
        !/^(required|email|date|submit)$/i.test(milestoneText) &&
        !/receive a copy|email address/i.test(milestoneText);

      if (looksReal) {
        milestones.push({
          ageMonths,
          domain: currentDomain,
          text: milestoneText,
          source: 'CDC Learn the Signs. Act Early.',
          sourceUrl,
        });
      }
    }
  });

  return milestones;
}

async function scrapeAll() {
  const all = [];

  for (const [ageMonths, url] of Object.entries(AGE_URLS)) {
    console.log(`Fetching ${ageMonths} months: ${url}`);
    const html = await fetchPage(url);
    const milestones = parseAgePage(html, Number(ageMonths), url);
    console.log(`  -> found ${milestones.length} milestones`);

    if (milestones.length === 0) {
      console.warn(
        `  WARNING: 0 milestones found for age ${ageMonths}. ` +
        `Inspect ${url} in devtools — markup may have changed.`
      );
    }

    all.push(...milestones);

    // Be a polite scraper — don't hammer a government server
    await new Promise((r) => setTimeout(r, 1500));
  }

  const outputPath = path.join('prisma', 'seed-data', 'cdc-milestones-raw.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    JSON.stringify(all, null, 2),
    'utf-8'
  );
  console.log(`\nDone. ${all.length} total milestones written to ${outputPath}`);
  console.log('Next: manually review the JSON before seeding your DB.');
}

scrapeAll().catch((err) => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
