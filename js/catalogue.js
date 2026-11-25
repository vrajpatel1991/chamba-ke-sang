// The rules that decide what the public may see. The page and tools/check-data.mjs both import this,
// so the site can never show something the check would not pass. No DOM, no Node: it runs in both.

export const EXCLUDED_TYPES = [
  'visitor-teaching',
  'rabbit-photography',
  'photographs-of-children',
  'not-for-sale'
];

// Words that name an excluded practice, however the row is written in the Sheet.
const EXCLUDED_WORDS = [
  /\bteach(ing)?\b[^.]*\bschool\b/i,
  /\bschool\b[^.]*\bvolunteer/i,
  /\bvolunteer(ing)?\b[^.]*\bschool\b/i,
  /\brabbit\b/i,
  /\bchildren\b[^.]*\bphotograph/i,
  /\bphotograph[^.]*\bchildren\b/i
];

export const INTERESTS = ['craft', 'kitchen', 'nature', 'culture-and-faith', 'adventure', 'rest'];
export const SESSIONS = ['morning', 'afternoon', 'evening'];
export const LAYERS = ['anchor', 'pathway', 'free', 'encounter'];

export function hostsById (hosts) {
  const map = new Map();
  for (const h of hosts) map.set(h.id, h);
  return map;
}

/** Every host on the item has given hosting consent. An item with no host has nobody to ask. */
export function consentRecorded (item, byId) {
  const ids = item.hostIds || [];
  return ids.every((id) => byId.get(id)?.consent?.hosting === true);
}

/** What a host may be called on the page: the name only where listing consent covers it. */
export function hostLabel (host) {
  if (!host) return null;
  return host.consent?.listing === true && host.name ? host.name : host.role;
}

export function hostLabels (item, byId) {
  return (item.hostIds || []).map((id) => hostLabel(byId.get(id))).filter(Boolean);
}

export function excludedReason (item) {
  if (item.excludedType) return item.excludedType;
  const text = [item.name, item.summary, item.description].filter(Boolean).join(' ');
  for (const re of EXCLUDED_WORDS) if (re.test(text)) return re.source;
  return null;
}

/** bookable | development | hidden. Nothing else is ever shown. */
export function classify (item, byId) {
  if (excludedReason(item)) return 'hidden';
  const consent = consentRecorded(item, byId);
  if (!consent) return 'hidden';
  if (item.tier >= 2) return 'bookable';
  if (item.tier === 1) return 'development';
  return 'hidden';
}

export function visible (items, byId) {
  const bookable = [];
  const development = [];
  for (const item of items) {
    const state = classify(item, byId);
    if (state === 'bookable') bookable.push(item);
    else if (state === 'development') development.push(item);
  }
  return { bookable, development };
}

/** Is this experience on offer in the month the visitor picked? */
export function inMonth (item, month) {
  return Array.isArray(item.months) && item.months.includes(month);
}

/** A figure may be shown only when figures.json carries it with a source and verified true. */
export function figure (figures, id) {
  const f = (figures.figures || []).find((x) => x.id === id);
  if (!f || f.verified !== true || !f.source) return null;
  return f;
}
