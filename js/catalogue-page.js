// The full catalogue: everything bookable, grouped by base, and everything in development with the
// reason it is not for sale. The rules come from js/catalogue.js, so this page and the check agree.

import data from '../data/data.js';
import { hostsById, hostLabels, visible } from './catalogue.js';

const byId = hostsById(data.hosts.hosts);
const places = new Map(data.places.places.map((p) => [p.id, p]));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (price) => (price ? `From ₹${price.amount.toLocaleString('en-IN')} ${price.unit}` : '');

const { bookable, development } = visible(data.experiences.experiences, byId);

function row (item) {
  const who = hostLabels(item, byId);
  return '<li>'
    + `<span class="rows__name">${esc(item.name)}</span>`
    + `<span class="rows__value">${esc(item.lengthText)}</span>`
    + `<p>${esc(item.summary)}</p>`
    + `<p class="t-small muted">${esc([item.layer, item.seasonText, who[0]].filter(Boolean).join(' · '))}</p>`
    + '</li>';
}

const slot = document.querySelector('[data-bookable]');
if (slot) {
  const bases = data.places.places.filter((p) => p.kind === 'base');
  const columns = bases.map((base) => {
    const here = bookable.filter((e) => e.base === base.id);
    return `<div class="span-6 stack-4">`
      + `<p class="t-label">${esc(base.label)}</p>`
      + `<ul class="rows"><li>`
      + `<span class="rows__name">${esc(base.name)}</span>`
      + `<span class="rows__value">${esc(money(base.priceFrom))}</span>`
      + `<p>${esc(base.description)}</p>`
      + `<p class="t-small muted">stay · ${esc(base.seasonText)} · <a class="link" href="standard.html">the homestay standard</a></p>`
      + '</li>'
      + here.map(row).join('')
      + '</ul></div>';
  });
  const town = bookable.filter((e) => !bases.some((b) => b.id === e.base));
  if (town.length) {
    columns.push('<div class="span-6 stack-4">'
      + `<p class="t-label">Days out from either base</p>`
      + `<ul class="rows">${town.map(row).join('')}</ul></div>`);
  }
  slot.innerHTML = columns.join('');
}

const dev = document.querySelector('[data-development]');
if (dev) {
  dev.innerHTML = development.length
    ? '<p class="t-label">In development</p>'
      + '<p class="measure">These are not for sale. They carry no price and no hold-dates action until the line under each is settled.</p>'
      + `<ul class="rows">${development.map((item) => '<li>'
        + `<span class="rows__name">${esc(item.name)}</span>`
        + `<span class="rows__value t-small muted">${esc(places.get(item.base)?.name ?? item.base)}</span>`
        + `<p>${esc(item.summary)}</p>`
        + `<p class="t-small muted">Waiting on: ${esc(item.blockedBy)}</p>`
        + '</li>').join('')}</ul>`
    : '<p class="measure">Nothing is in development at the moment. Everything that has consent and a verified tier is on sale above.</p>';
}
