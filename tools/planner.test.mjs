// The six rules of the planner, and one case per scenario in the journey-planner spec.
//   node --test tools/planner.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readData } from './check-data.mjs';
import { plan, itineraryText, score, candidates, PAID_CAP, DEFAULT_INPUTS } from '../js/planner.js';
import { hostsById, classify } from '../js/catalogue.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = await readData(ROOT);
const clone = (x) => JSON.parse(JSON.stringify(x));

const catalogueFrom = (d) => ({
  experiences: d.experiences.experiences,
  hosts: d.hosts.hosts,
  journeys: d.journeys.journeys,
  places: d.places.places,
  legs: d.places.legs
});
const catalogue = catalogueFrom(data);

const sessionsOf = (result) => result.days.flatMap((day) => day.sessions);

test('defaults: a 3-night light journey for a couple, craft and kitchen first', () => {
  assert.deepEqual(DEFAULT_INPUTS.interests, ['craft', 'kitchen']);
  assert.equal(DEFAULT_INPUTS.party, 'couple');
  assert.equal(DEFAULT_INPUTS.pace, 'light');
  assert.equal(DEFAULT_INPUTS.nights, 3);
  const result = plan({ month: 6 }, catalogue, 'a');
  assert.equal(result.nights, 3);
  assert.equal(result.days.length, 4);
});

test('rule 1: only bookable experiences, in month, at the chosen pace, are ever placed', () => {
  const result = plan({ month: 6, pace: 'light' }, catalogue, 'a');
  const byId = hostsById(catalogue.hosts);
  const placed = sessionsOf(result).filter((s) => !s.free);
  for (const session of placed) {
    const item = catalogue.experiences.find((e) => e.id === session.id);
    assert.equal(classify(item, byId), 'bookable', `${session.id} is not bookable`);
    assert.ok(item.months.includes(6), `${session.id} is out of season in June`);
    assert.ok(item.pace.includes('light'), `${session.id} is not a light-pace session`);
  }
});

test('rule 2: the first interest outscores the second, and the second the third', () => {
  const craft = { interests: ['craft'], impactWeight: 0 };
  const kitchen = { interests: ['kitchen'], impactWeight: 0 };
  const nature = { interests: ['nature'], impactWeight: 0 };
  const order = ['craft', 'kitchen', 'nature'];
  assert.ok(score(craft, order) > score(kitchen, order));
  assert.ok(score(kitchen, order) > score(nature, order));
  // local impact nudges a tie, it never outweighs an interest
  const heavy = { interests: ['nature'], impactWeight: 3 };
  assert.ok(score(craft, order) > score(heavy, order));
});

test('rule 3: the journey moves base at most once', () => {
  for (const nights of [3, 6]) {
    for (const party of ['couple', 'friends', 'study-group']) {
      const result = plan({ nights, party, month: 6 }, catalogue, 'a');
      assert.ok(result.moves <= 1, `${nights} nights for a ${party} moved base ${result.moves} times`);
    }
  }
});

test('rule 4: every day is filled evening, then morning, then afternoon', () => {
  const result = plan({ month: 6 }, catalogue, 'a');
  for (const day of result.days) {
    assert.deepEqual(day.sessions.map((s) => s.slot), ['evening', 'morning', 'afternoon']);
  }
});

test('scenario: session caps — one paid session a day on light, two on immersive', () => {
  for (const pace of ['light', 'immersive']) {
    const result = plan({ month: 6, pace, nights: 6, party: 'friends' }, catalogue, 'b');
    for (const day of result.days) {
      const paid = day.sessions.filter((s) => !s.free && s.paid).length;
      assert.ok(paid <= PAID_CAP[pace], `day ${day.day} holds ${paid} paid sessions on a ${pace} pace`);
    }
  }
});

test('scenario: young children — nothing unsuitable, and the ridge walk-in is never scheduled', () => {
  for (const nights of [3, 6]) {
    const result = plan({ nights, party: 'family-young-children', month: 6 }, catalogue, 'c');
    const placed = sessionsOf(result).filter((s) => !s.free);
    assert.ok(!placed.some((s) => s.id === 'ridge-walk-in'), 'the walk in to the ridge was scheduled');
    for (const session of placed) {
      const item = catalogue.experiences.find((e) => e.id === session.id);
      assert.notEqual(item.suitability.youngChildren, false, `${session.id} is not for young children`);
    }
    assert.ok(result.notes.some((n) => /small children/i.test(n)));
  }
});

test('scenario: nothing fits — the session says free time and why, never an empty slot', () => {
  const result = plan({ month: 1, nights: 3, party: 'friends' }, catalogue, 'd');
  const free = sessionsOf(result).filter((s) => s.free);
  assert.ok(free.length > 0, 'January on the ridge should leave open sessions');
  for (const session of sessionsOf(result)) {
    assert.ok(session.name, 'every session has words in it');
    if (session.free) assert.ok(session.reason && session.reason.length > 10, 'free time gives a reason');
  }
});

test('scenario: two cooks — the same session names a different host across journeys', () => {
  const edited = clone(data);
  edited.hosts.hosts.push(
    { id: 'cook-a', name: 'Cook A', role: 'a cook in the ridge village', base: 'mystic-village', consent: { hosting: true, photos: false, listing: true, records: false }, consentRecordedOn: '2026-11-24' },
    { id: 'cook-b', name: 'Cook B', role: 'a second cook in the ridge village', base: 'mystic-village', consent: { hosting: true, photos: false, listing: true, records: false }, consentRecordedOn: '2026-11-24' }
  );
  const dinner = edited.experiences.experiences.find((e) => e.id === 'riverside-dinner');
  dinner.hostIds = ['cook-a', 'cook-b'];

  const cat = catalogueFrom(edited);
  const named = new Set();
  // the river journey, where the dinner is cooked
  for (const seed of 'abcdefghijklmnopqrst') {
    const result = plan({ month: 6, nights: 3, party: 'family-young-children' }, cat, seed);
    const session = sessionsOf(result).find((s) => s.id === 'riverside-dinner');
    if (session) named.add(session.host);
  }
  assert.ok(named.size > 1, `one cook was always first: ${[...named].join(', ')}`);
  assert.ok(named.has('Cook A') && named.has('Cook B'));
});

test('one visit is stable: the same seed and inputs give the same journey', () => {
  const a = plan({ month: 6, nights: 6, party: 'friends' }, catalogue, 'steady');
  const b = plan({ month: 6, nights: 6, party: 'friends' }, catalogue, 'steady');
  assert.deepEqual(a, b);
});

test('scenario: unmeasured drive — a move between bases is labelled about and not confirmed', () => {
  const result = plan({ nights: 6, party: 'friends', month: 6 }, catalogue, 'e');
  const moving = result.days.filter((d) => d.travel);
  assert.ok(moving.length === 1, 'the 6-night journey moves base once');
  const leg = catalogue.legs.find((l) => l.from === 'h2o-house' && l.to === 'mystic-village');
  assert.equal(leg.confirmed, false);
  assert.equal(moving[0].travel.confirmed, false);
  assert.match(moving[0].travel.text, /about/i);
});

test('scenario: copy for partners — the itinerary carries no price', () => {
  const result = plan({ month: 6, nights: 6, party: 'friends' }, catalogue, 'f');
  const text = itineraryText(result);
  assert.ok(!/₹/.test(text), 'a rupee figure reached the clipboard');
  assert.ok(!/\b\d{3,}\b/.test(text.replace(/Day \d/g, '')), 'a number that could be a price reached the clipboard');
  assert.match(text, /Net rates on request/);
  assert.match(text, /Day 1/);
});

test('an experience is chosen by its fields, never by its name', () => {
  const edited = clone(data);
  for (const item of edited.experiences.experiences) item.name = `Row ${item.id}`;
  const renamed = plan({ month: 6, nights: 6, party: 'friends' }, catalogueFrom(edited), 'g');
  const original = plan({ month: 6, nights: 6, party: 'friends' }, catalogue, 'g');
  assert.deepEqual(
    renamed.days.map((d) => d.sessions.map((s) => s.id ?? 'free')),
    original.days.map((d) => d.sessions.map((s) => s.id ?? 'free'))
  );
});

test('candidates never include a hidden or in-development experience', () => {
  const byId = hostsById(catalogue.hosts);
  const pool = candidates(catalogue.experiences, byId, { month: 6, pace: 'light', party: 'couple' });
  for (const item of pool) assert.equal(classify(item, byId), 'bookable');
  assert.ok(!pool.some((e) => e.id === 'h2o-plant-walk'));
});
