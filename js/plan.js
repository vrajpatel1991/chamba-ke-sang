// plan.html: the day planner's view. js/planner.js decides the days; this draws them, shows the
// plain text a partner copies, and carries the journey into the hold-dates form on index.html.

import data from '../data/data.js';
import { plan, itineraryText, newSeed, DEFAULT_INPUTS } from './planner.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PARTY = [
  ['couple', 'A couple'],
  ['family-young-children', 'A family with young children'],
  ['friends', 'Friends'],
  ['study-group', 'A study group']
];
const INTEREST_PAIRS = [
  ['craft,kitchen', 'Craft, then the kitchen'],
  ['kitchen,craft', 'The kitchen, then craft'],
  ['nature,culture-and-faith', 'Nature, then culture'],
  ['culture-and-faith,craft', 'Culture, then craft'],
  ['rest,nature', 'Rest, then nature']
];

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const title = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const catalogue = {
  experiences: data.experiences.experiences,
  hosts: data.hosts.hosts,
  journeys: data.journeys.journeys,
  places: data.places.places,
  legs: data.places.legs
};

/** The first month the ridge is open from now, so the first plan a partner sees is one we can sell. */
function openMonth () {
  const now = new Date().getMonth() + 1;
  return now >= 3 && now <= 11 ? now : 3;
}

const seed = newSeed();
const params = new URLSearchParams(location.search);
const inputs = { ...DEFAULT_INPUTS, month: openMonth() };

// A link may carry a plan, so a partner can send on the one they built.
if (params.get('party')) inputs.party = params.get('party');
if (params.get('interests')) inputs.interests = params.get('interests').split(',');
const linkMonth = Number(params.get('month'));
if (linkMonth >= 1 && linkMonth <= 12) inputs.month = linkMonth;
if (params.get('pace') === 'immersive' || params.get('pace') === 'light') inputs.pace = params.get('pace');
if (Number(params.get('nights')) === 6) inputs.nights = 6;

const select = (id, label, options, value) => '<div class="field">'
  + `<label for="${id}">${esc(label)}</label>`
  + `<select id="${id}" name="${id}">`
  + options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`).join('')
  + '</select></div>';

function drawInputs (form) {
  form.innerHTML = [
    select('party', 'Who is travelling', PARTY, inputs.party),
    select('interests', 'Interests', INTEREST_PAIRS, inputs.interests.join(',')),
    select('month', 'Month', MONTHS.map((m, i) => [i + 1, m]), inputs.month),
    select('pace', 'Pace', [['light', 'Light'], ['immersive', 'Immersive']], inputs.pace),
    select('nights', 'Nights', [[3, '3 nights'], [6, '6 nights']], inputs.nights)
  ].join('');
}

function dayHtml (day) {
  const parts = [];
  if (day.travel) parts.push(`<span class="day__when">Travel:</span> ${esc(day.travel.text)}`);
  for (const s of day.sessions.filter((x) => !x.free)) {
    parts.push(`<span class="day__when">${esc(title(s.slot))}:</span> ${esc(s.name)}${s.host ? ` with ${esc(s.host)}` : ''}`);
  }
  const free = day.sessions.filter((s) => s.free);
  if (free.length) {
    parts.push(`<span class="day__when">Free:</span> ${esc(free.map((s) => s.slot).join(' and '))}`);
  }
  return '<li>'
    + '<div class="day__head">'
    + `<span class="rows__name">Day ${day.day}</span>`
    + `<span class="day__base">${esc(day.baseName)}</span>`
    + '</div>'
    + `<p class="day__line">${parts.join(' · ')}</p>`
    + (free.length ? `<p class="t-small muted">${esc(free[0].reason)}</p>` : '')
    + '</li>';
}

function draw () {
  const out = document.querySelector('[data-plan-out]');
  const copyBox = document.querySelector('[data-plan-copy]');
  const actions = document.querySelector('[data-plan-actions]');
  const status = document.querySelector('[data-plan-status]');
  if (!out) return;

  const result = plan(inputs, catalogue, seed);
  const text = itineraryText(result, data.settings.siteName);

  out.innerHTML = `<p class="t-label">${esc(result.name)}</p>`
    + `<ol class="days">${result.days.map(dayHtml).join('')}</ol>`
    + result.notes.map((n) => `<p class="t-small muted">${esc(n)}</p>`).join('');

  copyBox.innerHTML = `<p class="t-label">What partners copy</p><pre class="copy-block">${esc(text)}</pre>`;

  const carry = new URLSearchParams();
  const partner = params.get('p');
  if (partner) carry.set('p', partner);
  carry.set('journey', result.journeyId);
  carry.set('months', MONTHS[inputs.month - 1]);
  carry.set('plan', text);

  actions.innerHTML = '<button class="btn btn--secondary" type="button" data-copy>Copy itinerary</button>'
    + `<a class="btn btn--primary" href="index.html?${carry.toString()}#hold">Hold dates`
    + '<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a>';

  actions.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'The itinerary is on your clipboard.';
    } catch {
      status.textContent = 'Your browser would not let us reach the clipboard. Select the block above and copy it.';
    }
  });
}

const form = document.querySelector('[data-plan-inputs]');
if (form) {
  drawInputs(form);
  form.addEventListener('change', () => {
    inputs.party = form.elements.party.value;
    inputs.interests = form.elements.interests.value.split(',');
    inputs.month = Number(form.elements.month.value);
    inputs.pace = form.elements.pace.value;
    inputs.nights = Number(form.elements.nights.value);
    const url = new URL(location.href);
    for (const [k, v] of Object.entries({
      party: inputs.party, interests: inputs.interests.join(','), month: inputs.month, pace: inputs.pace, nights: inputs.nights
    })) url.searchParams.set(k, v);
    history.replaceState(null, '', url);
    draw();
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  draw();
}
