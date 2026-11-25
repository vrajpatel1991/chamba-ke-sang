// One case per scenario in the product-catalogue and trust-and-record specs.
//   node --test tools/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readData, checkData, checkPartners } from './check-data.mjs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { hostsById, classify, hostLabel, hostLabels, inMonth, figure, visible } from '../js/catalogue.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = await readData(ROOT);
const partners = JSON.parse(await readFile(join(ROOT, 'data', 'partners.json'), 'utf8'));
const byId = hostsById(data.hosts.hosts);

const clone = (x) => JSON.parse(JSON.stringify(x));

test('the shipped data passes the check', () => {
  assert.deepEqual(checkData(data), []);
  assert.deepEqual(checkPartners(partners, data.journeys), []);
});

test('scenario: editing an experience changes every place it is shown', () => {
  // The page reads the name from the data, so one edit is enough. Nothing keys off the name.
  const edited = clone(data);
  const item = edited.experiences.experiences.find((e) => e.id === 'village-walk');
  item.name = 'A walk through the ridge village';
  assert.deepEqual(checkData(edited), []);
  assert.equal(classify(item, hostsById(edited.hosts.hosts)), 'bookable');
});

test('scenario: not consented — a tier 2 experience without host consent does not appear', () => {
  const edited = clone(data);
  const hosts = edited.hosts.hosts;
  hosts.find((h) => h.id === 'village-guides-mystic').consent.hosting = false;
  const ids = hostsById(hosts);
  const item = edited.experiences.experiences.find((e) => e.id === 'village-walk');
  assert.equal(item.tier, 2);
  assert.equal(classify(item, ids), 'hidden');
  const { bookable, development } = visible(edited.experiences.experiences, ids);
  assert.ok(!bookable.some((e) => e.id === 'village-walk'));
  assert.ok(!development.some((e) => e.id === 'village-walk'));
});

test('scenario: in development — tier 1 with consent is listed without a booking action', () => {
  const walk = data.experiences.experiences.find((e) => e.id === 'h2o-plant-walk');
  assert.equal(walk.tier, 1);
  assert.equal(classify(walk, byId), 'development');
  const { development } = visible(data.experiences.experiences, byId);
  assert.ok(development.some((e) => e.id === 'h2o-plant-walk'));
  // Every item shown in development says what it is waiting for, and carries no price.
  for (const item of development) {
    assert.ok(item.blockedBy, `${item.id} must say what it is waiting for`);
    assert.equal(item.price, undefined);
  }
});

test('scenario: name without consent — the role is shown in place of the name', () => {
  const edited = clone(data);
  const host = edited.hosts.hosts.find((h) => h.id === 'chukh-maker');
  host.name = 'A named host';
  host.consent.listing = false;
  assert.equal(hostLabel(host), 'a Chamba Chukh maker in the ridge village');

  host.consent.listing = true;
  assert.equal(hostLabel(host), 'A named host');
});

test('a name in the data without listing consent fails the check', () => {
  const edited = clone(data);
  edited.hosts.hosts.find((h) => h.id === 'chukh-maker').name = 'A named host';
  const problems = checkData(edited);
  assert.ok(problems.some((p) => p.id === 'name-without-consent'));
});

test('scenario: out of season — an experience is unavailable in a month outside its season', () => {
  const ridge = data.experiences.experiences.find((e) => e.id === 'village-walk');
  assert.equal(ridge.seasonText, 'March to November');
  assert.equal(inMonth(ridge, 1), false);
  assert.equal(inMonth(ridge, 6), true);
  const river = data.experiences.experiences.find((e) => e.id === 'riverside-dinner');
  assert.equal(inMonth(river, 1), true);
});

test('scenario: data review — an excluded type fails the check', () => {
  for (const [field, value] of [
    ['excludedType', 'visitor-teaching'],
    ['name', 'Volunteer teaching at the village school'],
    ['summary', 'Rabbit photography with the children of the village']
  ]) {
    const edited = clone(data);
    edited.experiences.experiences[0][field] = value;
    const problems = checkData(edited);
    assert.ok(problems.some((p) => p.id === 'excluded-type'), `${field}=${value} must fail`);
  }
});

test('scenario: unverified figure in data — it is not rendered', () => {
  const edited = clone(data.figures);
  edited.figures.push({ id: 'guesswork', value: '87%', says: 'a satisfaction rate', verified: false });
  assert.equal(figure(edited, 'guesswork'), null);
  assert.equal(figure(edited, 'no-such-figure'), null);
  assert.ok(figure(edited, 'notonmap-mystic'));
});

test('an unverified or unsourced figure fails the check', () => {
  const edited = clone(data);
  edited.figures.figures.push({ id: 'guesswork', value: '87%', says: 'a satisfaction rate', verified: false });
  assert.ok(checkData(edited).some((p) => p.id === 'figure-unverified'));

  const second = clone(data);
  delete second.figures.figures[0].source;
  assert.ok(checkData(second).some((p) => p.id === 'figure-unsourced'));
});

test('a blocked figure anywhere in the data fails the check', () => {
  for (const value of ['87%', '3x', '129 room nights', '₹1.7L']) {
    const edited = clone(data);
    edited.experiences.experiences[0].summary = `Guests rate it ${value}.`;
    assert.ok(checkData(edited).some((p) => p.id === 'blocked-figure'), `${value} must fail`);
  }
});

test('every distance says whether it is confirmed', () => {
  for (const leg of data.places.legs) assert.equal(typeof leg.confirmed, 'boolean');
  const edited = clone(data);
  delete edited.places.legs[0].confirmed;
  assert.ok(checkData(edited).some((p) => p.id === 'unlabelled-distance'));
});

test('a figure a row points at must exist', () => {
  const edited = clone(data);
  edited.places.places[0].priceFrom.source = 'not-a-figure';
  assert.ok(checkData(edited).some((p) => p.id === 'figure-missing'));
});

test('a bookable stay records that it meets the homestay standard', () => {
  const edited = clone(data);
  edited.places.places.find((p) => p.id === 'mystic-village').standardMet = false;
  assert.ok(checkData(edited).some((p) => p.id === 'standard-not-met'));
});

test('exactly one partner type is the default, and each answers all six questions', () => {
  const edited = clone(partners);
  edited.partners[1].default = true;
  assert.ok(checkPartners(edited, data.journeys).some((p) => p.id === 'default-partner'));

  const second = clone(partners);
  delete second.partners[0].earn;
  assert.ok(checkPartners(second, data.journeys).some((p) => p.id === 'missing-field'));
});
