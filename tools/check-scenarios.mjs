#!/usr/bin/env node
// Walks every scenario the specs name, in a real browser, at 1440 and 390.
//   node tools/check-scenarios.mjs [--width 1440]
// It serves this folder over http on 127.0.0.1 and drives one headless Chrome over the DevTools
// protocol, the way the taste-skill's own checks do. It prints one line per scenario and exits 1
// on the first failure.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIDTHS = (process.argv.includes('--width')
  ? [Number(process.argv[process.argv.indexOf('--width') + 1])]
  : [1440, 390]);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon'
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome () {
  const c = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium'];
  const f = c.find((p) => p && fs.existsSync(p));
  if (!f) throw new Error('no Chrome found (set CHROME_PATH)');
  return f;
}

const server = http.createServer((req, res) => {
  try {
    let f = path.resolve(path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (f !== ROOT && !f.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
    if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  } catch { res.writeHead(404); res.end('not found'); }
});
const port = await new Promise((res) => server.listen(0, '127.0.0.1', () => res(server.address().port)));
const base = `http://127.0.0.1:${port}/`;

const profile = path.join(ROOT, '.taste-skill', 'chrome-scenarios');
fs.mkdirSync(profile, { recursive: true });
const portFile = path.join(profile, 'DevToolsActivePort');
try { fs.rmSync(portFile); } catch { /* none */ }
const child = spawn(findChrome(), ['--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars',
  '--mute-audio', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });

let failures = 0;
let total = 0;
const kill = () => { try { child.kill(); } catch { /* gone */ } };
const guard = setTimeout(() => { console.error('scenarios: timed out'); kill(); process.exit(2); }, 300000);

try {
  let cdp = null;
  for (let i = 0; i < 150 && !cdp; i += 1) {
    await sleep(100);
    try { cdp = parseInt(fs.readFileSync(portFile, 'utf8'), 10) || null; } catch { /* not yet */ }
  }
  if (!cdp) throw new Error('Chrome did not start');
  const ver = await (await fetch(`http://127.0.0.1:${cdp}/json/version`)).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  let id = 0;
  const pend = new Map();
  const subs = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else subs.forEach((f) => f(m));
  });
  const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = async (m, p) => { const r = await send(m, p, sessionId); if (r.error) throw new Error(`${m}: ${r.error.message}`); return r.result; };
  const evaluate = async (src) => (await S('Runtime.evaluate', { expression: src, awaitPromise: true, returnByValue: true })).result?.value;

  await S('Page.enable');
  await S('Runtime.enable');

  const errors = [];
  subs.push((m) => {
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    }
  });

  const open = async (href) => {
    await S('Page.navigate', { url: base + href });
    for (let i = 0; i < 100; i += 1) {
      await sleep(60);
      if (await evaluate('document.readyState === "complete"')) break;
    }
    await sleep(350); // the page's modules render from data/data.js
  };

  const check = async (name, src) => {
    total += 1;
    let got;
    try { got = await evaluate(`(() => { ${src} })()`); } catch (e) { got = 'threw: ' + e.message; }
    if (got === true) { console.log(`  ok    ${name}`); return; }
    failures += 1;
    console.log(`  FAIL  ${name}: ${got}`);
  };

  for (const width of WIDTHS) {
    await S('Emulation.setDeviceMetricsOverride', { width, height: width < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: width < 600 });
    console.log(`\n== ${width}px`);

    /* ---------------------------------------------------------- partner-offer */
    await open('index.html');
    await check('partner-offer / default view is the tour operator, marked as chosen', `
      const on = [...document.querySelectorAll('[data-partner]')].filter(p => !p.hidden);
      if (on.length !== 1) return 'panels showing: ' + on.length;
      if (on[0].dataset.partner !== 'operator') return 'showing ' + on[0].dataset.partner;
      const chip = document.querySelector('[data-switch] a[aria-current="true"]');
      return chip && chip.dataset.p === 'operator' ? true : 'the switcher marks ' + (chip && chip.dataset.p);
    `);
    await check('partner-offer / the six questions are answered in order', `
      const dts = [...document.querySelector('[data-partner]:not([hidden])').querySelectorAll('dt')].map(d => d.textContent);
      const want = ['What you sell','Who buys it','How you earn','Groups and months','Why you can trust it','How to hold dates'];
      return JSON.stringify(dts) === JSON.stringify(want) ? true : JSON.stringify(dts);
    `);
    await check('partner-offer / earnings show no price while the rate card is unapproved', `
      const dd = [...document.querySelectorAll('[data-partner]:not([hidden]) dd')][2].textContent;
      if (!/Net rates on request/.test(dd)) return dd;
      return /₹|\\d{3,}/.test(dd) ? 'a figure reached the earnings line: ' + dd : true;
    `);
    await check('partner-offer / capacity is honest about the river base', `
      const dd = [...document.querySelectorAll('[data-partner]:not([hidden]) dd')][3].textContent;
      return /not confirmed/.test(dd) && /12 guests/.test(dd) ? true : dd;
    `);
    await check('partner-offer / one main action, no WhatsApp while no number is set', `
      if (document.body.textContent.includes('WhatsApp on')) return 'a WhatsApp action is shown';
      const holds = [...document.querySelectorAll('a.btn, button.btn')].filter(b => b.textContent.trim().startsWith('Hold dates'));
      return holds.length >= 2 ? true : 'hold-dates buttons: ' + holds.length;
    `);
    await check('partner-offer / switching type changes the view and the address bar', `
      document.querySelector('[data-switch] a[data-p="institution"]').click();
      const on = [...document.querySelectorAll('[data-partner]')].filter(p => !p.hidden);
      if (on.length !== 1 || on[0].dataset.partner !== 'institution') return 'showing ' + on.map(p => p.dataset.partner);
      return new URL(location.href).searchParams.get('p') === 'institution' ? true : location.search;
    `);

    await open('index.html?p=hotel&utm_source=wave1');
    await check('partner-offer / a shared link with a campaign tag opens its view', `
      const on = [...document.querySelectorAll('[data-partner]')].filter(p => !p.hidden);
      return on.length === 1 && on[0].dataset.partner === 'hotel' ? true : 'showing ' + on.map(p => p.dataset.partner);
    `);

    await open('index.html?p=not-a-partner');
    await check('partner-offer / an unknown type falls back, with no error shown', `
      const on = [...document.querySelectorAll('[data-partner]')].filter(p => !p.hidden);
      if (on.length !== 1 || on[0].dataset.partner !== 'operator') return 'showing ' + on.map(p => p.dataset.partner);
      return /not a partner|no such|error/i.test(document.querySelector('#offer').textContent) ? 'an error is shown' : true;
    `);

    /* -------------------------------------------------------------- place-map */
    await open('index.html');
    await check('place-map / the map draws itself, with no third-party request in it', `
      const svg = document.querySelector('#map-frame svg');
      if (!svg) return 'no map';
      const names = [...svg.querySelectorAll('.mp-node')].map(n => n.dataset.place);
      for (const want of ['h2o-house','mystic-village','chamba-town','khajjiar','dalhousie','pathankot','chamba-bus-stand']) {
        if (!names.includes(want)) return 'the map is missing ' + want;
      }
      if (svg.querySelector('image, iframe, foreignObject')) return 'the map loads something from elsewhere';
      return true;
    `);
    await check('place-map / no household location is published', `
      return /\\d{1,2}\\.\\d{4,}/.test(document.body.textContent) ? 'a coordinate is on the page' : true;
    `);
    await check('place-map / selecting a base highlights it and lists its arrival and sessions', `
      document.querySelector('[data-base="mystic-village"]').click();
      const on = document.querySelector('#map-frame .mp-base.is-on');
      if (!on || on.dataset.place !== 'mystic-village') return 'the map marks ' + (on && on.dataset.place);
      const rows = document.querySelector('[data-arrivals]').textContent;
      if (!/2 km/.test(rows)) return 'the arrival does not mention the walk: ' + rows;
      return /Village walk on the ridge/.test(rows) ? true : 'the sessions are missing: ' + rows;
    `);
    await check('place-map / every distance says whether it is confirmed', `
      const rows = document.querySelector('[data-arrivals]').textContent;
      return /about |not measured yet/.test(rows) ? true : rows;
    `);

    /* ------------------------------------------------------- product-catalogue */
    await check('product-catalogue / a hidden item never reaches the page', `
      for (const name of ['Chamba Chukh making','Gaddi weaving','Chamba Rumal embroidery','Cooking Siddu']) {
        if (document.body.textContent.includes(name)) return name + ' is on the page';
      }
      return true;
    `);
    await check('product-catalogue / no host is named, and the roles stand in', `
      for (const name of ['Anjna','Rekha','Bramhi','Sapna','Lambo','Vikas','Renu']) {
        if (document.body.textContent.includes(name)) return name + ' is named without consent';
      }
      return true;
    `);
    await check('product-catalogue / every visible item carries its base, season and length', `
      const rows = [...document.querySelectorAll('#catalogue .rows > li')];
      if (rows.length < 4) return 'rows: ' + rows.length;
      return rows.every(r => /All year|March to November/.test(r.textContent)) ? true : 'a row has no season';
    `);

    await open('catalogue.html');
    await check('product-catalogue / an in-development item has no price and no hold-dates action', `
      const dev = document.querySelector('[data-development]');
      if (!dev || !dev.textContent.includes('In development')) return 'no in-development list';
      if (/₹/.test(dev.textContent)) return 'a price is shown on an in-development item';
      if (dev.querySelector('a[href*="#hold"], .btn')) return 'an in-development item offers a booking';
      return /Waiting on:/.test(dev.textContent) ? true : 'it does not say what it waits for';
    `);
    await check('product-catalogue / the standard is one tap from a stay', `
      return !!document.querySelector('#bookable a[href="standard.html"]') ? true : 'no link to the standard';
    `);

    /* ----------------------------------------------------- trust-and-record */
    await open('record.html');
    await check('trust-and-record / the example is labelled hypothetical', `
      const slip = document.querySelector('.slip');
      if (!slip) return 'no slip';
      return /Hypothetical example/.test(slip.textContent) ? true : slip.textContent.slice(0, 60);
    `);
    await check('trust-and-record / the record says payment, never benefit or impact', `
      const text = document.querySelector('main').textContent;
      if (/\\bbenefit\\b/i.test(text)) return 'the word benefit is in the record copy';
      if (/\\bimpact\\b/i.test(text)) return 'the word impact is in the record copy';
      return /payments?/i.test(text) ? true : 'it never says payment';
    `);
    await check('trust-and-record / no unverified figure is published', `
      const text = document.body.textContent;
      for (const bad of ['87%','3x repeat','129 room nights','1.7L']) if (text.includes(bad)) return bad + ' is published';
      return true;
    `);
    await check('trust-and-record / the footer names NotOnMap with one credits line', `
      const foot = document.querySelector('footer.closing');
      if (!/NotOnMap/.test(foot.textContent)) return 'NotOnMap is not named';
      if (!foot.querySelector('a[href*="notonmap.com"]')) return 'no link to notonmap.com';
      const credits = foot.querySelectorAll('a.credits');
      return credits.length === 1 ? true : 'credit links: ' + credits.length;
    `);

    await open('visitor-code.html');
    await check('trust-and-record / the visitor code lists its five rules', `
      const rows = document.querySelectorAll('#code .rows > li');
      return rows.length === 5 ? true : 'rules: ' + rows.length;
    `);

    await open('standard.html');
    await check('trust-and-record / the homestay standard names the 2025 rules', `
      return /Home Stay Rules 2025/.test(document.querySelector('main').textContent) ? true : 'the rules are not named';
    `);

    /* -------------------------------------------------------- journey-planner */
    await open('plan.html');
    await check('journey-planner / it opens on a 3-night light journey for a couple', `
      const f = document.querySelector('[data-plan-inputs]');
      if (f.elements.nights.value !== '3') return 'nights ' + f.elements.nights.value;
      if (f.elements.pace.value !== 'light') return 'pace ' + f.elements.pace.value;
      if (f.elements.party.value !== 'couple') return 'party ' + f.elements.party.value;
      if (f.elements.interests.value !== 'craft,kitchen') return 'interests ' + f.elements.interests.value;
      const m = Number(f.elements.month.value);
      return m >= 3 && m <= 11 ? true : 'the month is closed on the ridge: ' + m;
    `);
    await check('journey-planner / every session is filled or says why it is free', `
      const days = [...document.querySelectorAll('.days > li')];
      if (days.length !== 4) return 'days: ' + days.length;
      return days.every(d => d.textContent.trim().length > 20) ? true : 'a day is empty';
    `);
    await check('journey-planner / what partners copy carries no price', `
      const box = document.querySelector('.copy-block');
      if (!box) return 'no copy block';
      if (/₹/.test(box.textContent)) return 'a rupee figure is in the block';
      return /Net rates on request/.test(box.textContent) ? true : 'it does not say rates are on request';
    `);
    await check('journey-planner / a family with young children never gets the ridge walk-in', `
      const f = document.querySelector('[data-plan-inputs]');
      f.elements.party.value = 'family-young-children';
      f.dispatchEvent(new Event('change', { bubbles: true }));
      const text = document.querySelector('[data-plan-out]').textContent;
      if (/The walk in to the ridge/.test(text)) return 'the walk in was scheduled';
      return /small children/.test(text) ? true : 'it does not say why';
    `);
    await check('journey-planner / six nights moves base once and labels the drive', `
      const f = document.querySelector('[data-plan-inputs]');
      f.elements.party.value = 'friends';
      f.elements.nights.value = '6';
      f.dispatchEvent(new Event('change', { bubbles: true }));
      const days = [...document.querySelectorAll('.days > li')];
      if (days.length !== 7) return 'days: ' + days.length;
      const travel = days.filter(d => /Travel:/.test(d.textContent));
      if (travel.length !== 1) return 'moves: ' + travel.length;
      return /about/i.test(travel[0].textContent) ? true : travel[0].textContent;
    `);
    await check('journey-planner / hold dates carries the journey into the form', `
      const a = document.querySelector('[data-plan-actions] a.btn--primary');
      const u = new URL(a.href);
      if (!u.pathname.endsWith('index.html')) return u.pathname;
      if (!u.searchParams.get('plan')) return 'no plan carried';
      return u.hash === '#hold' && u.searchParams.get('journey') ? true : a.getAttribute('href');
    `);

    /* -------------------------------------------------------- enquiry-capture */
    await open('index.html');
    await check('enquiry-capture / the form asks for every field the brief names', `
      const f = document.querySelector('form.form');
      for (const n of ['organisation','name','email','phone','partner','months','guests','journey','message']) {
        if (!f.elements[n]) return 'no field ' + n;
        const label = document.querySelector('label[for="' + n + '"]');
        if (!label || !label.textContent.trim()) return n + ' has no label you can see';
      }
      return true;
    `);
    await check('enquiry-capture / a privacy line and the visitor code sit above the send button', `
      const f = document.querySelector('form.form');
      const line = [...f.querySelectorAll('p')].find(p => /NotOnMap only/.test(p.textContent));
      if (!line) return 'no privacy line';
      const btn = f.querySelector('button[type="submit"]');
      if (!(line.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING)) return 'it sits below the button';
      return !!line.querySelector('a[href="visitor-code.html"]') ? true : 'no link to the visitor code';
    `);
    await check('enquiry-capture / sending without an email stops and names the field', `
      const f = document.querySelector('form.form');
      f.elements.organisation.value = 'A tour operator';
      f.elements.name.value = 'A contact';
      f.elements.months.value = 'April';
      f.elements.guests.value = '4';
      f.elements.email.value = '';
      f.querySelector('button[type="submit"]').click();
      const err = document.getElementById('email-err');
      if (!err || err.hidden) return 'no error under the email field';
      if (f.elements.email.getAttribute('aria-invalid') !== 'true') return 'the field is not marked invalid';
      if (/is in/.test(document.querySelector('[data-form-status]').textContent)) return 'a confirmation was shown';
      return /Add an email so we can reply/.test(err.textContent) ? true : err.textContent;
    `);
    await check('enquiry-capture / with no endpoint the form opens an email and shows no success', `
      const f = document.querySelector('form.form');
      if (f.dataset.endpoint) return 'an endpoint is set: ' + f.dataset.endpoint;
      if (!/^mailto:/.test(f.getAttribute('action'))) return 'the form does not fall back to email';
      const status = document.querySelector('[data-form-status]');
      return !status.textContent.includes('is in') ? true : 'a sent line is shown: ' + status.textContent;
    `);

    await open('index.html?p=institution&journey=river-to-ridge-6&months=September&plan=Day%201');
    await check('enquiry-capture / arriving from the planner fills the form in', `
      const f = document.querySelector('form.form');
      if (f.elements.partner.value !== 'institution') return 'partner ' + f.elements.partner.value;
      if (f.elements.journey.value !== 'river-to-ridge-6') return 'journey ' + f.elements.journey.value;
      if (f.elements.months.value !== 'September') return 'months ' + f.elements.months.value;
      return f.elements.message.value.includes('Day 1') ? true : 'the journey did not reach the message';
    `);
  }

  if (errors.length) {
    console.log(`\n  FAIL  the console threw ${errors.length}: ${errors[0].split('\n')[0]}`);
    failures += 1;
    total += 1;
  } else {
    console.log('\n  ok    no console error on any page');
    total += 1;
  }
} finally {
  clearTimeout(guard);
  kill();
  server.close();
}

console.log(`\n${total - failures} of ${total} scenarios pass.`);
process.exitCode = failures ? 1 : 0;
