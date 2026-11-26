// On Their Map. Everything on the page is read from data/trip.json: the three promises, the five
// versions of the trip, the eight Marks and the eight days of whichever version is chosen.
// The Marks never change between versions; only the day's title, what you do, who you meet and the
// swaps do, so one Mark is written once and shown with every version.

import data from '../data/data.js';
import { mountForm } from './form.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const params = new URLSearchParams(location.search);
const list = (items) => items.map((i) => `<li>${esc(i)}</li>`).join('');

/* --------------------------------------------------------------- promises */

const promises = document.querySelector('[data-promises]');
if (promises) {
  promises.innerHTML = data.promises.map((p) => '<div>'
    + `<dt>${esc(p.title)}</dt><dd>${esc(p.line)}</dd>`
    + '</div>').join('');
}

/* ------------------------------------------------------------ the facts */

const facts = document.querySelector('[data-route-facts]');
if (facts) {
  const t = data.trip;
  facts.innerHTML = [
    ['Getting in', t.gettingIn],
    ['Getting out', t.gettingOut],
    ['Nights', t.nightsSplit],
    ['Best seasons', t.seasons],
    ['Nearest air and rail', `${t.air}. ${t.rail}.`]
  ].map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
}

/* ------------------------------------------------------ the Map of Marks */

const counts = document.querySelector('[data-counts]');
if (counts) {
  counts.innerHTML = data.mapOfMarks.counts
    .map((c) => `<div><dt>${esc(c.value)}</dt><dd>${esc(c.label)}</dd></div>`).join('');
}

for (const el of document.querySelectorAll('[data-trust]')) el.textContent = data.trust.line;
for (const el of document.querySelectorAll('[data-consent]')) el.textContent = data.consent;

const contact = document.querySelector('[data-contact]');
if (contact) {
  const c = data.contact;
  contact.innerHTML = [
    `<li><a href="https://${esc(c.web.replace(/^www\./, 'www.'))}">${esc(c.web)}</a></li>`,
    `<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`,
    `<li><a href="https://wa.me/${esc(c.whatsapp.replace(/[^0-9]/g, ''))}">Message us on WhatsApp</a></li>`
  ].join('');
}

/* ------------------------------------------------------------- the days */

/** One day: the Mark it leaves, then what you do, then where you sleep. */
function dayHtml (mark, day) {
  const swaps = day.swaps.length
    ? `<p class="day__swaps"><span class="day__when">Or swap in:</span> ${esc(day.swaps.join(' · '))}</p>`
    : '';
  const fallback = mark.fallback ? `<p class="day__swaps">${esc(mark.fallback)}</p>` : '';
  return '<li class="day">'
    + '<div class="day__head">'
    + `<p class="t-label day__n">${esc(mark.valley)}</p>`
    + `<h3>Day ${mark.day}: ${esc(day.title)}</h3>`
    + `<p class="day__mark">Mark ${mark.day} of 8: ${esc(mark.mark)} <span lang="hi">${esc(mark.hindi)}</span></p>`
    + '</div>'
    + '<div class="day__body">'
    + `<div class="day__col"><p class="t-label">The impact</p><p>${esc(mark.impact)}</p>`
    + `<p class="day__count"><strong>${mark.peopleSoFar}</strong> people impacted so far</p></div>`
    + `<div class="day__col"><p class="t-label">What you do</p><ul class="day__list">${list(day.do)}</ul>${swaps}${fallback}</div>`
    + `<div class="day__col"><p class="t-label">Who you meet</p><ul class="day__list">${list(day.meet)}</ul></div>`
    + '<div class="day__col"><p class="t-label">Your share goes to</p>'
    + `<p>${esc(mark.shareGoesTo)}</p>`
    + `<p class="t-label day__tonight-label">Tonight</p><p class="t-small">${esc(mark.tonight)}</p></div>`
    + '</div>'
    + '</li>';
}

/* ------------------------------------------------------- choose the trip */

const nav = document.querySelector('[data-switch]');
const about = document.querySelector('[data-trip-about]');
const daysSlot = document.querySelector('[data-days]');
const tripName = document.querySelector('[data-trip-name]');

if (nav) {
  const trips = data.trips;
  nav.innerHTML = trips.map((t) => `<a href="?trip=${esc(t.id)}#trips" data-trip="${esc(t.id)}">${esc(t.label)}</a>`).join('');

  const fallback = trips.find((t) => t.default) || trips[0];

  const show = (id, push) => {
    const trip = trips.find((t) => t.id === id) || fallback;

    for (const a of nav.querySelectorAll('a')) {
      const on = a.dataset.trip === trip.id;
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current', 'true');
    }

    if (about) about.innerHTML = '<dl class="answers">'
      + `<div><dt>Who it suits</dt><dd>${esc(trip.suits)}</dd></div>`
      + `<div><dt>What changes</dt><dd>${esc(trip.changes)}</dd></div>`
      + '</dl>';

    if (tripName) tripName.textContent = `The ${trip.label.toLowerCase()} trip. Every version funds the same eight causes with the same host families; only how you take part changes.`;

    if (daysSlot) daysSlot.innerHTML = data.marks.map((mark, i) => dayHtml(mark, trip.days[i])).join('');

    const form = document.querySelector('form.form');
    if (form && form.elements.trip) form.elements.trip.value = trip.id;

    if (push) {
      const url = new URL(location.href);
      url.searchParams.set('trip', trip.id);
      url.hash = '';
      history.replaceState(null, '', url);
    }
  };

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-trip]');
    if (!a) return;
    e.preventDefault();
    show(a.dataset.trip, true);
  });

  // A link that names no trip, or names one we do not run, opens the give-back trip and says nothing.
  show(params.get('trip'), false);
}

/* --------------------------------------------------------------- the form */

const slot = document.querySelector('[data-form-slot]');
if (slot) mountForm(slot, data, params);
