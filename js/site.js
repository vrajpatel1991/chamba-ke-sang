// The showcase page: the partner switcher, the catalogue, the map and the form, all read from
// data/data.js. Nothing here decides what may be shown: js/catalogue.js does, and tools/check-data.mjs
// checks the same rules before the site is published.

import data from '../data/data.js';
import { hostsById, classify, hostLabels, visible, figure } from './catalogue.js';
import { mountMap, selectBase, legLabel } from './map.js';
import { mountForm } from './form.js';

const byId = hostsById(data.hosts.hosts);
const places = new Map(data.places.places.map((p) => [p.id, p]));
const params = new URLSearchParams(location.search);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const money = (price) => (price ? `From ₹${price.amount.toLocaleString('en-IN')} ${price.unit}` : '');

/* ---------------------------------------------------------------- partners */

function partnerPanel (partner) {
  const rows = [
    ['What you sell', partner.sell],
    ['Who buys it', partner.buyer],
    ['How you earn', `${partner.earn} ${data.settings.rates.approved ? '' : data.settings.rates.onRequest + '.'}`.trim()],
    ['Groups and months', partner.groupText],
    ['Why you can trust it', partner.trust],
    ['How to hold dates', `Send us the months and the group size. We reply ${data.settings.replyTime}.`]
  ];
  return `<dl class="answers" data-partner="${esc(partner.id)}">`
    + rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')
    + '</dl>';
}

function mountPartners () {
  const nav = document.querySelector('[data-switch]');
  const slot = document.querySelector('[data-partners]');
  if (!nav || !slot) return;

  const list = data.partners.partners;
  nav.innerHTML = list.map((p) => `<a href="?p=${esc(p.id)}#offer" data-p="${esc(p.id)}">${esc(p.label)}</a>`).join('');
  slot.innerHTML = list.map(partnerPanel).join('');

  const fallback = list.find((p) => p.default) || list[0];
  const show = (id, push) => {
    const chosen = list.find((p) => p.id === id) || fallback;
    for (const a of nav.querySelectorAll('a')) {
      const on = a.dataset.p === chosen.id;
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current', 'true');
    }
    for (const panel of slot.querySelectorAll('[data-partner]')) {
      panel.hidden = panel.dataset.partner !== chosen.id;
    }
    const form = document.querySelector('form.form');
    if (form && form.elements.partner) form.elements.partner.value = chosen.id;
    if (push) {
      const url = new URL(location.href);
      url.searchParams.set('p', chosen.id);
      url.hash = '';
      history.replaceState(null, '', url);
    }
  };

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-p]');
    if (!a) return;
    e.preventDefault();
    show(a.dataset.p, true);
  });

  // An unknown type in the link falls back to the default, and nothing says so.
  show(params.get('p'), false);
}

/* --------------------------------------------------------------- catalogue */

/** A catalogue row: the name, what it costs or how long it takes, and its status labels. */
function itemRow (item) {
  const meta = [item.layer, item.seasonText].filter(Boolean).join(' · ');
  return '<li>'
    + `<span class="rows__name">${esc(item.name)}</span>`
    + `<span class="rows__value">${esc(item.lengthText)}</span>`
    + `<p class="t-small muted">${esc(meta)}</p>`
    + '</li>';
}

function stayRow (stay) {
  return '<li>'
    + `<span class="rows__name">${esc(stay.name)}</span>`
    + `<span class="rows__value">${esc(money(stay.priceFrom))}</span>`
    + `<p class="t-small muted">${esc(['stay', stay.seasonText].filter(Boolean).join(' · '))}</p>`
    + '</li>';
}

/** Two groups, one per base, each the same number of rows so their edges line up. */
function mountCatalogue (rowsPerGroup = 3) {
  const { bookable } = visible(data.experiences.experiences, byId);
  for (const slot of document.querySelectorAll('[data-group]')) {
    const baseId = slot.dataset.group;
    const stay = places.get(baseId);
    if (!stay) continue;
    const sessions = bookable
      .filter((e) => e.base === baseId)
      .sort((a, b) => b.impactWeight - a.impactWeight || a.name.localeCompare(b.name))
      .slice(0, rowsPerGroup - 1);
    slot.innerHTML = `<p class="t-label">${esc(stay.label)}</p>`
      + `<ul class="rows">${stayRow(stay)}${sessions.map(itemRow).join('')}</ul>`;
  }
}

/* --------------------------------------------------------- the map and base */

function mountVisit () {
  const frame = document.querySelector('[data-map]');
  const list = document.querySelector('[data-arrivals]');
  if (!frame || !list) return;
  mountMap(frame, data.places);

  const bases = data.places.places.filter((p) => p.kind === 'base');
  const chips = document.createElement('nav');
  chips.className = 'switch switch--tight';
  chips.setAttribute('aria-label', 'Which base');
  chips.innerHTML = bases.map((b) => `<a href="#visit" data-base="${esc(b.id)}">${esc(b.name)}</a>`).join('');
  list.before(chips);

  const { bookable } = visible(data.experiences.experiences, byId);
  const show = (id) => {
    const base = bases.find((b) => b.id === id) || bases[0];
    for (const a of chips.querySelectorAll('a')) {
      const on = a.dataset.base === base.id;
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current', 'true');
    }
    selectBase(frame, base.id);
    const here = bookable.filter((e) => e.base === base.id).map((e) => e.name);
    const legs = data.places.legs
      .filter((l) => l.to === base.id && legLabel(l))
      .map((l) => `${places.get(l.from)?.name ?? l.from}, ${legLabel(l)}`);
    const rows = [
      ['How to arrive', base.arrival],
      ['The way in', legs.join('; ') || 'Not measured yet'],
      ['Based here', here.join(', ') || 'Nothing is bookable here yet']
    ];
    if (!base.locationConfirmed && base.locationNote) rows.push(['Still to confirm', base.locationNote]);
    list.innerHTML = rows.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join('');
  };

  chips.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-base]');
    if (!a) return;
    e.preventDefault();
    show(a.dataset.base);
  });
  show(bases[0].id);
}

/* ------------------------------------------------------------------- start */

function mountHold () {
  const slot = document.querySelector('[data-form-slot]');
  if (slot) mountForm(slot, data, params);
}

mountVisit();
mountPartners();
mountCatalogue();
mountHold();

// The price on the first screen is shown only because figures.json carries it with its source.
if (!figure(data.figures, 'notonmap-mystic')) {
  const lead = document.querySelector('.hero__lead');
  if (lead) lead.textContent = 'Two village bases, river and ridge, 3 or 6 nights.';
}
