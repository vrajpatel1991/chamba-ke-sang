#!/usr/bin/env node
// Walks every scenario the specs name, in a real browser, at 1440 and 390.
//   node tools/check-scenarios.mjs [--width 1440] [--base https://…/]
// With --base it checks a site that is already published instead of this folder.
// It serves this folder over http on 127.0.0.1 and drives one headless Chrome over the DevTools
// protocol, the way the taste-skill's own checks do. It prints one line per scenario and exits 1
// on the first failure.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_ARG = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : null;
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
let base = BASE_ARG;
if (!base) {
  const port = await new Promise((res) => server.listen(0, '127.0.0.1', () => res(server.address().port)));
  base = `http://127.0.0.1:${port}/`;
} else if (!base.endsWith('/')) base += '/';
console.log('checking ' + base);

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
    const sep = href.includes('?') ? '&' : '?';
    await S('Page.navigate', { url: base + href + (BASE_ARG ? sep + 'cb=' + Date.now() : '') });
    for (let i = 0; i < 100; i += 1) {
      await sleep(60);
      if (await evaluate('document.readyState === "complete"')) break;
    }
    await sleep(BASE_ARG ? 1200 : 350); // the page's modules render from data/data.js
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

    await open('index.html');

    await check('the trip / the hero names it, in both languages, with the eight days on it', `
      const h1 = document.querySelector('h1').textContent.trim();
      if (!h1.startsWith('On Their Map')) return h1;
      if (!/8-day|eight day/i.test(h1)) return h1;
      if (!document.querySelector('[lang="hi"]')) return 'the Hindi title is missing';
      const notice = document.querySelector('.hero-notice').textContent;
      return /8 days/.test(notice) && /3 valleys/.test(notice) ? true : notice;
    `);

    await check('the trip / the three promises are shown', `
      const dts = [...document.querySelectorAll('.promises dt')].map(d => d.textContent);
      const want = ['People impacted','A cause each day','Something stays behind'];
      return JSON.stringify(dts) === JSON.stringify(want) ? true : JSON.stringify(dts);
    `);

    await check('choose your trip / five versions, the give-back trip chosen', `
      const chips = [...document.querySelectorAll('[data-switch] a')];
      if (chips.length !== 5) return 'versions: ' + chips.length;
      const on = chips.filter(c => c.getAttribute('aria-current') === 'true');
      return on.length === 1 && on[0].dataset.trip === 'give-back' ? true : 'chosen: ' + on.map(c => c.dataset.trip);
    `);

    await check('choose your trip / each version says who it suits and what changes', `
      const dts = [...document.querySelectorAll('[data-trip-about] dt')].map(d => d.textContent);
      return JSON.stringify(dts) === JSON.stringify(['Who it suits','What changes']) ? true : JSON.stringify(dts);
    `);

    await open('index.html?trip=family');
    await check('choose your trip / a shared link opens its version', `
      const on = document.querySelector('[data-switch] a[aria-current="true"]');
      if (!on || on.dataset.trip !== 'family') return 'chosen: ' + (on && on.dataset.trip);
      const about = document.querySelector('[data-trip-about]').textContent;
      return /Parents with children/.test(about) ? true : about.slice(0, 60);
    `);

    await open('index.html?trip=not-a-trip');
    await check('choose your trip / an unknown version falls back, with no error shown', `
      const on = document.querySelector('[data-switch] a[aria-current="true"]');
      if (!on || on.dataset.trip !== 'give-back') return 'chosen: ' + (on && on.dataset.trip);
      return /no such|unknown trip|error/i.test(document.querySelector('#trips').textContent) ? 'an error is shown' : true;
    `);

    await open('index.html');

    await check('the route / the three valleys, in order, as photographs', `
      const chapters = [...document.querySelectorAll('#days .mo-ph__ch h3')].map(h => h.textContent);
      if (chapters.length !== 3) return 'chapters: ' + chapters.length;
      if (!/Saal Valley/.test(chapters[0]) || !/Dwat Mahadev/.test(chapters[1]) || !/Khajjiar/.test(chapters[2])) return JSON.stringify(chapters);
      return [...document.querySelectorAll('#days img')].every(i => i.getAttribute('alt')) ? true : 'a chapter photograph has no alt';
    `);

    await check('every photograph is the client’s own, none a stand-in', `
      const imgs = [...document.querySelectorAll('img')];
      if (imgs.length < 5) return 'photographs: ' + imgs.length;
      for (const i of imgs) {
        if (i.dataset.source !== 'client') return i.getAttribute('src') + ' is ' + i.dataset.source;
        if (!i.getAttribute('alt')) return i.getAttribute('src') + ' has no alt';
      }
      return true;
    `);

    await check('the Map of Marks / what stays behind, counted', `
      const counts = [...document.querySelectorAll('.counts div')].map(d => d.textContent.replace(/\s+/g, ' ').trim());
      if (counts.length !== 5) return 'counts: ' + counts.length;
      return counts[0].startsWith('26') ? true : JSON.stringify(counts);
    `);

    await check('the Map of Marks / every figure carries where it came from', `
      const t = document.querySelector('[data-trust]').textContent;
      if (!/Impact Assessment for Mystic Village/.test(t)) return 'the figures carry no source';
      const c = document.querySelector('[data-consent]').textContent;
      return /named only with their consent/.test(c) ? true : c;
    `);

    await check('ask about dates / the form asks what a reply needs', `
      const f = document.querySelector('form.form');
      for (const n of ['name','email','trip','people','months','message']) {
        if (!f.elements[n]) return 'no field ' + n;
        const label = document.querySelector('label[for="' + n + '"]');
        if (!label || !label.textContent.trim()) return n + ' has no label you can see';
      }
      return true;
    `);

    await check('ask about dates / sending without an email stops and names the field', `
      const f = document.querySelector('form.form');
      f.elements.name.value = 'A traveller';
      f.elements.people.value = '2';
      f.elements.months.value = 'April';
      f.elements.email.value = '';
      f.querySelector('button[type="submit"]').click();
      const err = document.getElementById('email-err');
      if (!err || err.hidden) return 'no error under the email field';
      if (f.elements.email.getAttribute('aria-invalid') !== 'true') return 'the field is not marked invalid';
      if (/is in/.test(document.querySelector('[data-form-status]').textContent)) return 'a confirmation was shown';
      return /Add an email so we can reply/.test(err.textContent) ? true : err.textContent;
    `);

    await check('ask about dates / with no endpoint it opens an email and claims no send', `
      const f = document.querySelector('form.form');
      if (f.dataset.endpoint) return 'an endpoint is set: ' + f.dataset.endpoint;
      if (!/^mailto:/.test(f.getAttribute('action'))) return 'the form does not fall back to email';
      return !/is in/.test(document.querySelector('[data-form-status]').textContent) ? true : 'a sent line is shown';
    `);

    await open('index.html?trip=learning');
    await check('ask about dates / a shared link arrives with its trip chosen in the form', `
      const f = document.querySelector('form.form');
      return f.elements.trip.value === 'learning' ? true : f.elements.trip.value;
    `);

    await check('the trip page / every link lands somewhere on it', `
      for (const a of document.querySelectorAll('a[href^="#"]')) {
        const id = a.getAttribute('href').slice(1);
        if (!id) return 'a bare # link';
        if (!document.getElementById(id)) return '#' + id + ' lands nowhere';
      }
      return true;
    `);
    /* ---------------------------------------------------- the itinerary page */
    await open('days.html');

    await check('the days / eight days, each with its Mark, impact, people and tonight', `
      const days = [...document.querySelectorAll('.days > .day')];
      if (days.length !== 8) return 'days: ' + days.length;
      for (let i = 0; i < 8; i += 1) {
        const t = days[i].textContent;
        if (!t.includes('Mark ' + (i + 1) + ' of 8')) return 'day ' + (i + 1) + ' has no Mark';
        for (const label of ['The impact','What you do','Who you meet','Your share goes to','Tonight']) {
          if (!t.includes(label)) return 'day ' + (i + 1) + ' has no "' + label + '"';
        }
      }
      return true;
    `);

    await check('the days / the count of people grows down the trip', `
      const counts = [...document.querySelectorAll('.day__count strong')].map(n => Number(n.textContent));
      if (counts.length !== 8) return 'counts: ' + counts.length;
      for (let i = 1; i < counts.length; i += 1) if (counts[i] < counts[i - 1]) return 'it falls at day ' + (i + 1);
      return counts[7] === 26 ? true : 'it ends at ' + counts[7];
    `);

    await check('the days / day 4 says the valley may not be ready', `
      const four = document.querySelectorAll('.days > .day')[3].textContent;
      if (!/no guests yet|first footprint/i.test(four)) return 'day 4 does not say it is the first footprint';
      return /If the valley isn't ready yet/.test(four) ? true : 'it offers no fallback';
    `);

    await check('choose your trip / changing the version rewrites the days and the address bar', `
      const before = document.querySelector('.days > .day h3').textContent;
      document.querySelector('[data-switch] a[data-trip="trekker"]').click();
      const after = document.querySelector('.days > .day h3').textContent;
      if (before === after) return 'the days did not change';
      if (!/water mill/i.test(after)) return after;
      const marks = [...document.querySelectorAll('.day__mark')].map(m => m.textContent);
      if (!marks[0].includes('Keep a 3rd-century water mill turning')) return 'the Mark changed with the version';
      return new URL(location.href).searchParams.get('trip') === 'trekker' ? true : location.search;
    `);

    await check('the route / getting in, getting out, nights and seasons are all given', `
      const t = document.querySelector('[data-route-facts]').textContent;
      for (const want of ['Getting in','Getting out','Nights','Best seasons','Nearest air and rail']) {
        if (!t.includes(want)) return 'no ' + want;
      }
      return /9 km to Chaminoo/.test(t) && /22 km/.test(t) ? true : t.slice(0, 80);
    `);


    await check('the days page / the switcher carries the version across from the trip page', `
      const chips = [...document.querySelectorAll('[data-switch] a')];
      if (chips.length !== 5) return 'versions: ' + chips.length;
      document.querySelector('[data-switch] a[data-trip="slow-down"]').click();
      const first = document.querySelector('.days > .day h3').textContent;
      return /Start slow by the river/.test(first) ? true : first;
    `);

    await check('the days page / every link lands', `
      for (const a of document.querySelectorAll('a[href^="#"]')) {
        const id = a.getAttribute('href').slice(1);
        if (!id) return 'a bare # link';
        if (!document.getElementById(id)) return '#' + id + ' lands nowhere';
      }
      return true;
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
