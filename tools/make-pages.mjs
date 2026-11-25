#!/usr/bin/env node
// Writes the small pages (the catalogue, the Record, the visitor code, the homestay standard and
// privacy) from one shell, so every page carries the same nav, footer and credits line.
//   node tools/make-pages.mjs
// The result is plain static HTML. Edit the pages directly afterwards if you like; running this
// again overwrites them.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const NAV = (current) => `<header class="nav">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Skip to content</a>
    <a class="nav__logo" href="index.html"><span class="mark" data-mark="ring" aria-hidden="true"></span>Chamba ke sang</a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__item"><a class="nav__link" href="index.html#visit">Visit</a></div>
      <div class="nav__item"><a class="nav__link" href="index.html#offer">Partners</a></div>
      <div class="nav__item"><a class="nav__link" href="catalogue.html"${current === 'catalogue' ? ' aria-current="page"' : ''}>Stays</a></div>
      <div class="nav__item"><a class="nav__link" href="journey.html">Journey</a></div>
    </nav>
    <div class="nav__actions">
      <a class="btn btn--primary" href="index.html#hold">Hold dates</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>`;

const FOOTER = `<footer class="footer closing footer--visit" id="contact" style="--hm: 2" aria-labelledby="close-h">
  <div class="wrap">
    <div class="closing__cta close--type">
      <div class="section-head">
        <h2 id="close-h">Chamba ke sang, in the company of Chamba</h2>
        <p>Run by NotOnMap with the host families and village groups of Mystic Village and H2O House.</p>
      </div>
      <a class="btn btn--primary" href="index.html#hold">Hold dates<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a>
    </div>
    <div class="closing__links">
      <div class="grid">
        <div class="span-6 stack-4">
          <address class="footer__address">Chaminoo, Barour<br>Chamba, Himachal Pradesh</address>
          <p><a class="link" href="https://www.openstreetmap.org/search?query=Chaminoo+Barour+Chamba">See the area</a> · <a class="link" href="https://www.notonmap.com">notonmap.com</a></p>
        </div>
        <div class="span-6 start-7 stack-4">
          <h3>When the bases are open</h3>
          <dl class="hours">
            <dt>River base</dt><dd>All year</dd>
            <dt>Ridge base</dt><dd>March to November</dd>
            <dt>December to February</dt><dd>Snow can close the ridge</dd>
          </dl>
          <ul class="footer__nav">
            <li><a href="index.html">Home</a></li>
            <li><a href="catalogue.html">Stays</a></li>
            <li><a href="journey.html">Journey</a></li>
            <li><a href="standard.html">Standard</a></li>
            <li><a href="visitor-code.html">Visitor code</a></li>
            <li><a href="record.html">Record</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__legal">
        <span>&copy; 2026 Unknown Destinations Pvt Ltd &nbsp; <a href="privacy.html">Privacy</a></span>
        <a class="credits" href="credits.html">Photographs via Wikimedia Commons</a>
      </div>
    </div>
  </div>
</footer>

<nav class="actionbar" aria-label="Quick actions">
  <a class="btn btn--primary" href="index.html#hold">Hold dates</a>
</nav>`;

// Each page's hero photograph. Every one is a licensed stand-in of the real district or the real
// craft, listed in the build report with the photograph NotOnMap must supply in its place.
const HEROES = {
  plan: { src: 'assets/img/photo-f175573156-960.jpg', alt: 'Chamba town in its valley under monsoon cloud, the Chaugan in the middle', pos: '50% 58%', subject: 'Chamba town' },
  catalogue: { src: 'assets/img/photo-f182167637-960.jpg', alt: 'A warp of undyed yarn stretched on a wooden handloom', pos: '50% 50%', subject: 'a handloom' },
  record: { src: 'assets/img/photo-f185667234-960.jpg', alt: 'Two mud-washed houses in ochre and blue under slate roofs against an evening sky', pos: '50% 70%', subject: 'village houses' },
  'visitor-code': { src: 'assets/img/photo-f175556812-960.jpg', alt: 'The Chamba valley at dusk, the town along the river under wooded ridges', pos: '50% 56%', subject: 'the Chamba valley' },
  standard: { src: 'assets/img/photo-f191160298-960.jpg', alt: 'A slate roof with smoke rising from its chimney, a wooded ridge behind it', pos: '50% 62%', subject: 'a slate roof on the ridge' },
  privacy: { src: 'assets/img/photo-f175573156-960.jpg', alt: 'Chamba town in its valley under monsoon cloud, the Chaugan in the middle', pos: '50% 58%', subject: 'Chamba town' }
};

const page = ({ slug, title, description, h1, lead, action, sections, script, hero = HEROES[slug] }) => `<!doctype html>
<html lang="en" data-type="place" data-radius="soft" data-buttons="arrow" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="share.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#f1ece3">
<meta name="site-kind" content="other">
<meta name="page-type" content="place">
<meta name="page-kind" content="place">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400..600&family=Libre+Franklin:wght@400..600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/system.css">
<link rel="stylesheet" href="assets/ui/cards.css">
<link rel="stylesheet" href="assets/motion/motion.css">
<link rel="stylesheet" href="assets/layout/layout.css">
<link rel="stylesheet" href="assets/icons/icon.css">
<style>
:root {
  --p-bg: #f1ece3; --p-surface: #e6dfd2; --p-ink: #22211e; --p-muted: #63605c;
  --p-accent: #f2b705; --p-accent-ink: #111111; --p-action: #22211e; --p-action-ink: #f1ece3;
  --p-inv-bg: #22211e; --p-inv-surface: #2e2d29; --p-inv-ink: #f1ece3; --p-inv-muted: #9b9891;
  --p-inv-accent: #f2b705; --p-inv-accent-ink: #111111; --p-inv-action: #f2b705; --p-inv-action-ink: #111111;
  --font-display: "Source Serif 4", Georgia, serif;
  --font-text: "Libre Franklin", system-ui, sans-serif;
  --display-weight: 400;
  --display-tracking: -0.02em;
}
</style>
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
<link rel="stylesheet" href="page.css">
</head>
<body>
<!-- Written by tools/make-pages.mjs. The deal and the plan: .taste-skill/plan.md -->
${NAV(slug)}

<main id="top">
  <section class="hero hero--place" data-enter aria-labelledby="hero-h">
    <img class="hero__bg" data-phone-fill src="${hero.src}" alt="${hero.alt}" style="--ly-pos: ${hero.pos}" fetchpriority="high" data-source="stand-in" data-subject="${hero.subject}">
    <div class="wrap"><div class="hero-text">
      <div class="hero__text">
        <h1 id="hero-h">${h1}</h1>
        <p class="hero__lead">${lead}</p>
        <div class="btn-row"><a class="btn btn--primary" href="${action.href}">${action.label}<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a></div>
      </div>
    </div></div>
  </section>

${sections}
</main>

${FOOTER}

${script ? `<script type="module" src="${script}"></script>\n` : ''}<script type="module" src="assets/system.js"></script>
<script type="module" src="assets/motion/motion.js"></script>
<script type="module" src="assets/layout/layout.js"></script>
</body>
</html>
`;

const section = (id, heading, body, extra = '', style = '') => `  <section class="section${extra}" id="${id}"${style ? ` style="${style}"` : ''} aria-labelledby="${id}-h">
    <div class="wrap">
      <div class="section-head"><h2 id="${id}-h">${heading}</h2></div>
${body}
    </div>
  </section>`;

// A block too short to be a section of its own goes into the section above as its last element,
// with a label rather than a heading (layout-v4.md, Fill).
const tail = (label, body) => `      <div class="merged-block">
        <p class="t-label">${label}</p>
${body}
      </div>`;

const rows = (items) => '      <ul class="rows">\n'
  + items.map(([name, line]) => `        <li><span class="rows__name">${name}</span><p>${line}</p></li>`).join('\n')
  + '\n      </ul>';

const PAGES = [
  {
    slug: 'plan',
    title: 'Build the days: a Chamba ke sang journey, month by month',
    description: 'A planner that builds a 3-night or 6-night journey from the stays and sessions that are bookable in the month you pick.',
    h1: 'Build the days',
    lead: 'Pick the month, the pace and who is travelling. The planner fills the days from what is bookable then, and says why when nothing fits.',
    action: { href: '#planner', label: 'Build the days' },
    script: 'js/plan.js',
    sections: `  <section class="section ground-surface" id="planner" style="--h: 1; --hm: 2" aria-labelledby="planner-h">
    <div class="wrap">
      <div class="grid grid--top head-row">
        <h2 id="planner-h" class="span-4">The journey</h2>
        <form class="plan-inputs span-8" data-plan-inputs aria-label="What kind of journey"></form>
      </div>
      <div class="grid grid--top">
        <div class="span-6" data-plan-out></div>
        <div class="span-6 start-7 stack-4">
          <div data-plan-copy></div>
          <div class="btn-row" data-plan-actions></div>
          <p class="form__status" role="status" data-plan-status></p>
        </div>
      </div>
    </div>
  </section>`
  },
  {
    slug: 'catalogue',
    title: 'Stays and sessions: what Chamba ke sang can sell today',
    description: 'Every stay and session that passes the readiness and consent gate, and the ones still in development.',
    h1: 'What is bookable in Chamba today',
    lead: 'A stay or session is sold only when its readiness tier is 2 or above and every host on it has given consent. The rest is listed as in development, or not at all.',
    action: { href: '#bookable', label: 'See the catalogue' },
    script: 'js/catalogue-page.js',
    sections: `  <section class="section" id="bookable" style="--h: 2; --hm: 2" aria-labelledby="bookable-h">
    <div class="wrap">
      <div class="section-head"><h2 id="bookable-h">Bookable now</h2></div>
      <div class="grid grid--top" data-bookable></div>
      <div class="stack-4" data-development></div>
    </div>
  </section>`
  },
  {
    slug: 'record',
    title: 'The Chamba Local Spend Record: what a stay paid, with its evidence',
    description: 'How Chamba ke sang reports the payments a journey made to people in Chamba, what it counts and what it leaves out.',
    h1: 'The Chamba Local Spend Record',
    lead: 'One page by email within 7 days of checkout, showing what the stay paid people in Chamba, and what it did not.',
    action: { href: '#counts', label: 'See what it counts' },
    sections: [
      section('counts', 'What it counts', `      <p class="measure">It reports what was paid. A payment is counted when a bank or UPI reference shows it reached an account in the provider's own name.</p>
${rows([
  ['Direct Local Payment Rate', 'Payments to verified Chamba providers, over the total the guest paid.'],
  ['Local Value Retention', 'The same, plus payments to locally owned businesses in Chamba district.'],
  ['Providers paid', 'How many distinct payees the journey paid, and in which categories.'],
  ['Timeliness', 'The days between the service and the settlement.']
])}`),
      section('example', 'A hypothetical example', `      <div class="grid grid--top">
        <div class="span-6 stack-4">
          <p class="measure">These numbers are made up to show the shape of the record. They are not an estimate of any journey, and no journey has been run yet.</p>
          <p class="measure">The biggest line, the river base, is counted only once its ownership is shown. That is the honesty that makes the other lines worth reading.</p>
        </div>
        <div class="span-6 start-7">
          <div class="slip">
            <p class="slip__label">Hypothetical example</p>
            <ul class="slip__rows">
              <li><span>Ridge base, 3 nights</span><span>₹6,000</span></li>
              <li><span>Meals, two cooks</span><span>₹3,000</span></li>
              <li><span>Sessions, seven payees</span><span>₹7,500</span></li>
              <li><span>Transport and porter</span><span>₹4,500</span></li>
              <li><span>Village coordinator</span><span>₹1,500</span></li>
              <li><span>Village fund</span><span>₹1,875</span></li>
              <li><span>NotOnMap fee, shown separately</span><span>₹7,000</span></li>
              <li><span>Paid to 14 people and groups in Chamba</span><span>₹24,375</span></li>
            </ul>
          </div>
        </div>
      </div>
${tail('What is left out', `        <p class="measure">Cash with no reference, a partner's own markup, and anything not yet paid. NotOnMap's fee, GST and the gateway cost are printed on every record and never counted as a local payment. Every figure carries its date, its method and the date of the last outside review.</p>
${rows([
  ['Cash with no reference', 'Reported on the record, never counted in the headline figures.'],
  ['A partner markup', 'It is the partner\'s earning, not a payment in Chamba.'],
  ['Guests\' own time', 'Work a guest does is never counted as a payment to anybody.']
])}`)}`, ' ground-surface', '--h: 2; --hm: 2')
    ].join('\n\n')
  },
  {
    slug: 'visitor-code',
    title: 'The visitor code: five rules for a stay in Chamba',
    description: 'The five rules every guest of Chamba ke sang is given before arrival and signs at check-in.',
    h1: 'The visitor code',
    lead: 'Five rules, given before arrival and signed at check-in. They are the villages\' rules, not ours.',
    action: { href: '#code', label: 'Read the code' },
    sections: [
      section('code', 'Five rules', rows([
        ['Ask before every photograph', 'Of a person, a house or a kitchen. A no needs no reason. Children are never photographed.'],
        ['Follow each house\'s rules', 'On alcohol, on dress, on where shoes come off. They differ from house to house.'],
        ['Carry your waste out', 'Everything that came up the hill with you goes back down with you.'],
        ['No cash or sweets for children', 'Pay the household, through us, for what you were given.'],
        ['Enter shrines and kitchens only when you are invited', 'Both are somebody\'s, and an invitation is not assumed.']
      ]) + '\n' + tail('Why it is written down', `        <p class="measure">A village that hosts strangers carries the cost of every misunderstanding. Writing the rules down means a guest can follow them without being corrected, and a host does not have to ask twice.</p>
        <p class="measure">Any provider can pause an experience by telling the coordinator, with no reason needed. A village meeting can close any experience. We take a paused item off sale within a day.</p>`))
    ].join('\n\n')
  },
  {
    slug: 'standard',
    title: 'The homestay standard: what every bookable stay meets',
    description: 'The registration, bathroom, water, contact and emergency standard every Chamba ke sang stay meets before it is sold.',
    h1: 'The homestay standard',
    lead: 'What a stay meets before it is sold. A house that does not meet it is listed as in development, or not at all.',
    action: { href: '#standard', label: 'Read the standard' },
    sections: [
      section('standard', 'Five things, checked before a stay is sold', rows([
        ['Registered', 'Under the Himachal Pradesh Home Stay Rules 2025, with the certificate on file.'],
        ['A bathroom you were told about', 'Private, or shared and said so before booking. Never a surprise.'],
        ['Filtered drinking water', 'In the house, not bought in bottles.'],
        ['A named contact on call', 'One person, for the whole stay, who answers.'],
        ['A written emergency plan', 'With the hospital distance and a route out, held by the host and by us.']
      ]) + '\n' + tail('How a house gets there', `        <p class="measure">A provider moves up rather than being shut out. Tier 1 is a house with consent recorded and training begun; tier 2 is a house that has passed the checks above and hosted guests. Only tier 2 and above is sold.</p>
        <p class="measure">NotOnMap pays for the training, the registration help and the bathroom and safety upgrades out of grant money, never out of the guest price, so nobody pays twice for the same work.</p>`))
    ].join('\n\n')
  },
  {
    slug: 'privacy',
    title: 'Privacy: what the hold-dates form collects',
    description: 'What the Chamba ke sang hold-dates form collects, who reads it and how long it is kept.',
    h1: 'What this site collects',
    lead: 'The hold-dates form, and nothing else. There is no tracker, no advertising tag and no cookie on this site.',
    action: { href: '#form-data', label: 'Read what we keep' },
    sections: [
      section('form-data', 'The hold-dates form', rows([
        ['What it asks', 'Your organisation, a contact name, an email, a phone number if you give one, the kind of partner you are, the months, the group size, the journey and your message.'],
        ['Who reads it', 'NotOnMap, which is Unknown Destinations Pvt Ltd, in Chamba. Nobody else.'],
        ['Where it goes', 'A sheet NotOnMap owns. Nothing is passed to an advertiser or a data broker.'],
        ['How long it is kept', 'Two seasons, then it is deleted unless you have become a partner.'],
        ['How to have it deleted', 'Reply to any message from us and ask. We delete it within a week.']
      ]) + '\n' + tail('What this site does not do', `        <p class="measure">No analytics script runs on these pages. A link we send in an outreach message may carry a campaign tag, which arrives with your form entry and tells us which message you opened. Nothing follows you after you leave.</p>
        <p class="measure">The photographs on this site are loaded from this site. The one thing a page asks of another company is its two typefaces, from Google Fonts.</p>`))
    ].join('\n\n')
  }
];

for (const spec of PAGES) {
  await writeFile(join(ROOT, `${spec.slug}.html`), page(spec));
}
console.log(`wrote ${PAGES.map((p) => `${p.slug}.html`).join(', ')}`);
