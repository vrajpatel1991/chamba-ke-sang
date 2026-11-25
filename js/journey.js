// journey.html: the shapes a journey can take, read from data/journeys.json.
// The planner itself lives on plan.html (js/plan.js).

import data from '../data/data.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const places = new Map(data.places.places.map((p) => [p.id, p]));

const slot = document.querySelector('[data-shapes]');
if (slot) {
  slot.innerHTML = '<ul class="rows">' + data.journeys.journeys.map((j) => {
    const bases = [...new Set(j.days.map((d) => d.base))].map((id) => places.get(id)?.name ?? id);
    const children = j.suitability?.youngChildren === false ? 'Not with small children' : 'Small children welcome';
    return '<li>'
      + `<span class="rows__name">${esc(j.name)}</span>`
      + `<span class="rows__value">${j.nights} nights</span>`
      + `<p class="t-small muted">${esc(bases.join(' · '))} · ${esc(children)}</p>`
      + '</li>';
  }).join('') + '</ul>';
}
