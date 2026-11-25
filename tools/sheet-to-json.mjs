#!/usr/bin/env node
// Turns a CSV export of one tab of NotOnMap's Google Sheet into the matching data file,
// and back again, so the Sheet and data/ never drift.
//
//   node tools/sheet-to-json.mjs experiences export/experiences.csv   # CSV  -> data/experiences.json
//   node tools/sheet-to-json.mjs experiences --to-csv > experiences.csv   # data/experiences.json -> CSV
//
// Columns are the field names. A nested field is written with a dot (suitability.youngChildren).
// A list is one cell with semicolons between the items. A yes/no column is a true/false field.
// An empty cell means "no value": a column listed as nullable becomes null, any other is left out.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const TABS = {
  experiences: {
    file: 'experiences.json',
    rows: 'experiences',
    nullable: ['excludedType'],
    columns: {
      id: 'text',
      name: 'text',
      base: 'text',
      layer: 'text',
      session: 'text',
      lengthHours: 'number',
      lengthText: 'text',
      interests: 'text-list',
      months: 'number-list',
      seasonText: 'text',
      pace: 'text-list',
      paid: 'yesno',
      'suitability.youngChildren': 'yesno',
      'suitability.lowMobility': 'yesno',
      impactWeight: 'number',
      tier: 'number',
      hostIds: 'text-list',
      excludedType: 'text',
      summary: 'text',
      blockedBy: 'text'
    }
  },
  hosts: {
    file: 'hosts.json',
    rows: 'hosts',
    nullable: ['name'],
    columns: {
      id: 'text',
      name: 'text',
      role: 'text',
      base: 'text',
      'consent.hosting': 'yesno',
      'consent.photos': 'yesno',
      'consent.listing': 'yesno',
      'consent.records': 'yesno',
      consentRecordedOn: 'text',
      consentNote: 'text'
    }
  },
  partners: {
    file: 'partners.json',
    rows: 'partners',
    nullable: [],
    columns: {
      id: 'text',
      label: 'text',
      default: 'yesno',
      sell: 'text',
      buyer: 'text',
      earn: 'text',
      earnModel: 'text',
      journeyId: 'text',
      groupMax: 'number',
      groupText: 'text',
      trust: 'text',
      action: 'text'
    }
  }
};

// ---- cells -----------------------------------------------------------------

function readCell (value, type) {
  if (value === '') return undefined;
  if (type === 'number') return Number(value);
  if (type === 'yesno') return value.trim().toLowerCase() === 'yes';
  if (type === 'text-list') return value.split(';').map((s) => s.trim()).filter(Boolean);
  if (type === 'number-list') return value.split(';').map((s) => s.trim()).filter(Boolean).map(Number);
  return value;
}

function writeCell (value, type) {
  if (value === undefined || value === null) return '';
  if (type === 'yesno') return value ? 'yes' : 'no';
  if (type === 'text-list' || type === 'number-list') return value.join('; ');
  return String(value);
}

function get (row, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), row);
}

function set (row, path, value) {
  const keys = path.split('.');
  let node = row;
  while (keys.length > 1) {
    const key = keys.shift();
    node[key] ??= {};
    node = node[key];
  }
  node[keys[0]] = value;
}

// ---- CSV -------------------------------------------------------------------

export function parseCsv (text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ''));
}

export function toCsv (rows, tab) {
  const spec = TABS[tab];
  const names = Object.keys(spec.columns);
  const quote = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [names.map(quote).join(',')];
  for (const row of rows) {
    lines.push(names.map((name) => quote(writeCell(get(row, name), spec.columns[name]))).join(','));
  }
  return lines.join('\n') + '\n';
}

export function fromCsv (text, tab) {
  const spec = TABS[tab];
  const [header, ...body] = parseCsv(text);
  const names = header.map((h) => h.trim());
  for (const name of names) {
    if (!(name in spec.columns)) throw new Error(`the ${tab} tab has a column this site does not know: ${name}`);
  }
  for (const name of Object.keys(spec.columns)) {
    if (!names.includes(name)) throw new Error(`the ${tab} tab is missing the column ${name}`);
  }
  return body.map((cells) => {
    const row = {};
    names.forEach((name, i) => {
      const value = readCell(cells[i] ?? '', spec.columns[name]);
      if (value !== undefined) set(row, name, value);
      else if (spec.nullable.includes(name)) set(row, name, null);
    });
    return row;
  });
}

// ---- files -----------------------------------------------------------------

export async function readTab (tab, root = ROOT) {
  const spec = TABS[tab];
  const json = JSON.parse(await readFile(join(root, 'data', spec.file), 'utf8'));
  return { json, rows: json[spec.rows] };
}

async function main () {
  const [tab, arg] = process.argv.slice(2);
  if (!tab || !TABS[tab]) {
    console.error(`usage: sheet-to-json.mjs <${Object.keys(TABS).join('|')}> <export.csv | --to-csv>`);
    process.exitCode = 1;
    return;
  }
  if (arg === '--to-csv') {
    const { rows } = await readTab(tab);
    process.stdout.write(toCsv(rows, tab));
    return;
  }
  if (!arg) {
    console.error('give the CSV you exported from the Sheet, or --to-csv');
    process.exitCode = 1;
    return;
  }
  const spec = TABS[tab];
  const { json } = await readTab(tab);
  json[spec.rows] = fromCsv(await readFile(arg, 'utf8'), tab);
  await writeFile(join(ROOT, 'data', spec.file), JSON.stringify(json, null, 2) + '\n');
  console.log(`${spec.file}: ${json[spec.rows].length} rows from ${arg}. Now run: node tools/check-data.mjs`);
}

if (process.argv[1] && process.argv[1].endsWith('sheet-to-json.mjs')) await main();
