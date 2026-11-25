// A drawn map of Chamba district, built from data/places.json. No map service, no key, no tile:
// it is an SVG this page draws itself, so it renders with every third party blocked.
// It shows where the bases, the town and the arrival points sit, never a household's door.

const W = 400;
const H = 300;

const px = (place) => ({ x: (place.x / 100) * W, y: (place.y / 100) * H });

/** "22 km", "about 24 km", "about 2 km on foot", or the honest blank. */
export function legLabel (leg) {
  const parts = [];
  if (leg.km != null) parts.push(`${leg.km} km`);
  if (!parts.length) return leg.confirmed ? '' : 'not measured yet';
  const text = parts.join(' ');
  const onFoot = leg.mode && leg.mode.includes('walk') ? ' on foot' : '';
  return leg.confirmed ? `${text}${onFoot}` : `about ${text}${onFoot}`;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function mapSvg (places) {
  const byId = new Map(places.places.map((p) => [p.id, p]));
  const drawn = places.legs.filter((l) => byId.has(l.from) && byId.has(l.to) && l.mode !== 'walk');

  const lines = drawn.map((leg) => {
    const a = px(byId.get(leg.from));
    const b = px(byId.get(leg.to));
    const stitch = leg.route === 'stitch';
    return `<path class="${stitch ? 'mp-stitch' : 'mp-line'}" d="M${a.x.toFixed(1)} ${a.y.toFixed(1)} L${b.x.toFixed(1)} ${b.y.toFixed(1)}"/>`;
  }).join('');

  // A leg nobody has measured carries no figure on the map, and a short one would sit on its own
  // places' names; the visit panel gives both in words.
  const labels = drawn.map((leg) => {
    if (leg.km == null || leg.km < 10) return '';
    const text = legLabel(leg);
    const a = px(byId.get(leg.from));
    const b = px(byId.get(leg.to));
    // off the line, square to it, so a figure never sits on its own route
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const x = (a.x + b.x) / 2 + (-dy / len) * 11;
    const y = (a.y + b.y) / 2 + (dx / len) * 11 + 4;
    return `<text class="mp-meta" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle">${esc(text)}</text>`;
  }).join('');

  const nodes = places.places.map((place) => {
    const p = px(place);
    const anchor = place.labelAnchor || (place.x > 55 ? 'end' : 'start');
    const dx = (anchor === 'end' ? -14 : 14) + (place.labelDx || 0);
    const base = place.kind === 'base';
    const dot = base
      ? `<circle class="mp-ring" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="10"/><circle class="mp-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5"/>`
      : `<circle class="mp-dot${place.kind === 'arrival' ? ' mp-dot--arrival' : ''}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5"/>`;
    return `<g class="mp-node${base ? ' mp-base' : ''}" data-place="${esc(place.id)}">`
      + dot
      + `<text class="mp-label" x="${(p.x + dx).toFixed(1)}" y="${(p.y + 4 + (place.labelDy || 0)).toFixed(1)}" text-anchor="${anchor}">${esc(place.shortName || place.name)}</text>`
      + '</g>';
  }).join('');

  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${lines}${labels}${nodes}</svg>`;
}

/** Marks one base on the map. Everything else about the selection lives in the visit panel. */
export function selectBase (root, baseId) {
  for (const node of root.querySelectorAll('.mp-base')) {
    node.classList.toggle('is-on', node.dataset.place === baseId);
  }
}

export function mountMap (root, places) {
  root.innerHTML = mapSvg(places);
  return root;
}
