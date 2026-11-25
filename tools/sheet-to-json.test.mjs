// The Sheet and data/ must say the same thing after a round trip.
//   node --test tools/sheet-to-json.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv, fromCsv, parseCsv, readTab, TABS } from './sheet-to-json.mjs';

test('experiences.json survives a round trip through CSV unchanged', async () => {
  const { rows } = await readTab('experiences');
  assert.deepEqual(fromCsv(toCsv(rows, 'experiences'), 'experiences'), rows);
});

test('hosts and partners survive the same round trip', async () => {
  for (const tab of ['hosts', 'partners']) {
    const { rows } = await readTab(tab);
    assert.deepEqual(fromCsv(toCsv(rows, tab), tab), rows, `${tab} changed`);
  }
});

test('a cell holding a comma, a quote or a line break comes back whole', () => {
  const rows = [{
    id: 'x', name: 'Siddu, ghee and a quote: "steamed"', base: 'b', layer: 'anchor', session: 'morning',
    lengthHours: 1, lengthText: 'an hour', interests: ['craft'], months: [1, 2], seasonText: 'All year',
    pace: ['light'], paid: true, suitability: { youngChildren: true, lowMobility: false },
    impactWeight: 1, tier: 2, hostIds: ['h1'], excludedType: null,
    summary: 'Two lines\nin one cell'
  }];
  assert.deepEqual(fromCsv(toCsv(rows, 'experiences'), 'experiences'), rows);
});

test('an empty cell is null for a nullable column and left out otherwise', () => {
  const { columns } = TABS.experiences;
  const header = Object.keys(columns).join(',');
  const row = Object.keys(columns).map((name) => {
    if (name === 'id') return 'x';
    if (name === 'tier' || name === 'impactWeight' || name === 'lengthHours') return '1';
    if (name === 'paid' || name.startsWith('suitability.')) return 'yes';
    if (name === 'excludedType' || name === 'blockedBy') return '';
    return 'v';
  }).join(',');
  const [parsed] = fromCsv(`${header}\n${row}\n`, 'experiences');
  assert.equal(parsed.excludedType, null);
  assert.ok(!('blockedBy' in parsed));
});

test('a column the site does not know stops the import', () => {
  assert.throws(() => fromCsv('id,surprise\nx,1\n', 'experiences'), /does not know: surprise/);
  assert.throws(() => fromCsv('id\nx\n', 'experiences'), /missing the column/);
});

test('the CSV reader handles quoted commas and doubled quotes', () => {
  assert.deepEqual(parseCsv('a,b\n"one, two","he said ""no"""\n'), [['a', 'b'], ['one, two', 'he said "no"']]);
});
