#!/usr/bin/env node
// Checks data/*.json before the site is published. Run it after every edit of the Sheet:
//   node tools/check-data.mjs
// It prints one line per problem and exits 1 when anything fails.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  hostsById, classify, consentRecorded, excludedReason, hostLabel,
  INTERESTS, SESSIONS, LAYERS
} from '../js/catalogue.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_EXPERIENCE_FIELDS = [
  'id', 'name', 'base', 'layer', 'session', 'lengthText', 'interests', 'months',
  'seasonText', 'pace', 'paid', 'suitability', 'impactWeight', 'tier', 'hostIds', 'excludedType'
];

export async function readData (root = ROOT) {
  const read = async (name) => JSON.parse(await readFile(join(root, 'data', name), 'utf8'));
  const [settings, places, experiences, hosts, journeys, figures] = await Promise.all([
    read('settings.json'), read('places.json'), read('experiences.json'),
    read('hosts.json'), read('journeys.json'), read('figures.json')
  ]);
  return { settings, places, experiences, hosts, journeys, figures };
}

/** Returns an array of problems. Empty means the data may be published. */
export function checkData (data) {
  const problems = [];
  const fail = (id, where, message) => problems.push({ id, where, message });

  const { settings, places, experiences, hosts, journeys, figures } = data;
  const byId = hostsById(hosts.hosts);
  const placeIds = new Set(places.places.map((p) => p.id));
  const figureIds = new Set((figures.figures || []).map((f) => f.id));
  const items = experiences.experiences;
  const stays = places.places.filter((p) => p.kind === 'base');

  // 1. Excluded content never reaches the catalogue.
  for (const item of [...items, ...stays]) {
    const reason = excludedReason(item);
    if (reason) fail('excluded-type', item.id, `carries an excluded type (${reason}); take the row out of the Sheet`);
  }

  // 2. Every field the specs name is present, and holds a value the page can read.
  for (const item of items) {
    for (const field of REQUIRED_EXPERIENCE_FIELDS) {
      if (!(field in item)) fail('missing-field', item.id, `has no "${field}"`);
    }
    if (!placeIds.has(item.base)) fail('unknown-base', item.id, `names a base that is not in places.json: ${item.base}`);
    if (!LAYERS.includes(item.layer)) fail('bad-layer', item.id, `layer must be one of ${LAYERS.join(', ')}`);
    if (!SESSIONS.includes(item.session)) fail('bad-session', item.id, `session must be one of ${SESSIONS.join(', ')}`);
    for (const interest of item.interests || []) {
      if (!INTERESTS.includes(interest)) fail('bad-interest', item.id, `interest "${interest}" is not one of ${INTERESTS.join(', ')}`);
    }
    if (!Array.isArray(item.months) || item.months.length === 0) fail('no-months', item.id, 'has no months, so the planner can never place it');
    if (!Array.isArray(item.pace) || item.pace.length === 0) fail('no-pace', item.id, 'has no pace');
    for (const id of item.hostIds || []) {
      if (!byId.has(id)) fail('unknown-host', item.id, `names a host that is not in hosts.json: ${id}`);
    }
    if (item.tier >= 2 && item.blockedBy) {
      fail('tier-contradiction', item.id, 'is tier 2 or above but still carries blockedBy; drop one of them');
    }
    if (item.tier <= 1 && classify(item, byId) === 'development' && !item.blockedBy) {
      fail('no-blocker', item.id, 'is shown in development but does not say what it is waiting for');
    }
  }

  // 3. A name is never published without listing consent.
  for (const host of hosts.hosts) {
    if (host.name && host.consent?.listing !== true) {
      fail('name-without-consent', host.id, 'has a name in the data but no listing consent; the page would show the role, so clear the name or record the consent');
    }
    if (!host.role) fail('no-role', host.id, 'has no role, so an experience without listing consent has nothing to show');
    if (host.consent?.hosting === true && !host.consentRecordedOn) {
      fail('no-consent-date', host.id, 'has hosting consent with no date; consent is renewed every year, so it needs one');
    }
  }

  // 4. Stays pass the same gate, and carry what the status labels need.
  for (const stay of stays) {
    if (typeof stay.tier !== 'number') fail('missing-field', stay.id, 'has no tier');
    if (!Array.isArray(stay.hostIds)) fail('missing-field', stay.id, 'has no hostIds');
    if (!stay.seasonText) fail('missing-field', stay.id, 'has no seasonText');
    if (classify(stay, byId) === 'bookable' && stay.standardMet !== true) {
      fail('standard-not-met', stay.id, 'is bookable but does not record that it meets the homestay standard');
    }
  }

  // 5. Every figure a row points at exists, is verified and carries a source.
  const sourced = [
    ...places.places.flatMap((p) => (p.priceFrom?.source ? [[p.id, p.priceFrom.source]] : [])),
    ...places.legs.flatMap((l) => (l.source ? [[`${l.from}-${l.to}`, l.source]] : [])),
    ...Object.entries(settings.capacity || {}).flatMap(([k, v]) => (v.source ? [[`capacity.${k}`, v.source]] : []))
  ];
  for (const [where, id] of sourced) {
    if (!figureIds.has(id)) fail('figure-missing', where, `points at a figure that is not in figures.json: ${id}`);
  }
  for (const f of figures.figures || []) {
    if (f.verified !== true) fail('figure-unverified', f.id, 'is not verified, so it is never rendered; take it out or verify it');
    if (!f.source) fail('figure-unsourced', f.id, 'has no source');
  }

  // 6. A blocked figure never appears anywhere in the data.
  const haystack = JSON.stringify({ settings, places, experiences, journeys });
  for (const b of figures.blocked || []) {
    if (haystack.includes(b.value)) {
      fail('blocked-figure', b.value, `appears in the data: ${b.reason}`);
    }
  }

  // 7. A distance or drive time says whether it is confirmed.
  for (const leg of places.legs) {
    if (typeof leg.confirmed !== 'boolean') {
      fail('unlabelled-distance', `${leg.from}-${leg.to}`, 'does not say whether it is confirmed');
    }
  }

  // 8. No price is published as a net rate until the rate card is approved.
  if (settings.rates?.approved !== true) {
    for (const p of places.places) {
      if (p.netRate != null) fail('net-rate-published', p.id, 'carries a net rate while settings.rates.approved is false');
    }
  }

  // 9. Every journey day stands at a place the map knows.
  for (const j of journeys.journeys) {
    if (!placeIds.has(j.arriveBase)) fail('unknown-base', j.id, `arrives at a base that is not in places.json: ${j.arriveBase}`);
    for (const d of j.days) {
      if (!placeIds.has(d.base)) fail('unknown-base', j.id, `day ${d.day} stands at a place that is not in places.json: ${d.base}`);
    }
    if (j.days.length !== j.nights + 1) fail('journey-shape', j.id, `has ${j.nights} nights but ${j.days.length} days`);
  }

  // 10. A partner type points at a journey that exists.
  return problems;
}

export function checkPartners (partners, journeys) {
  const problems = [];
  const ids = new Set(journeys.journeys.map((j) => j.id));
  let defaults = 0;
  for (const p of partners.partners) {
    if (p.default) defaults += 1;
    if (!ids.has(p.journeyId)) problems.push({ id: 'unknown-journey', where: p.id, message: `points at a journey that is not in journeys.json: ${p.journeyId}` });
    for (const field of ['label', 'sell', 'buyer', 'earn', 'groupText', 'trust']) {
      if (!p[field]) problems.push({ id: 'missing-field', where: p.id, message: `has no "${field}"; the six partner questions must all be answered` });
    }
  }
  if (defaults !== 1) problems.push({ id: 'default-partner', where: 'partners.json', message: `exactly one partner type is the default, found ${defaults}` });
  return problems;
}

async function main () {
  const data = await readData();
  const partners = JSON.parse(await readFile(join(ROOT, 'data', 'partners.json'), 'utf8'));
  const problems = [...checkData(data), ...checkPartners(partners, data.journeys)];

  const byIdMap = hostsById(data.hosts.hosts);
  const counts = { bookable: 0, development: 0, hidden: 0 };
  for (const item of data.experiences.experiences) counts[classify(item, byIdMap)] += 1;

  if (problems.length === 0) {
    console.log(`data: ok. ${counts.bookable} bookable, ${counts.development} in development, ${counts.hidden} hidden.`);
    return;
  }
  for (const p of problems) console.error(`FAIL ${p.id}  ${p.where}: ${p.message}`);
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}. The site is not published until they are fixed.`);
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  await main();
}

export { hostLabel, consentRecorded, classify };
