// The day planner. plan(inputs, catalogue, seed) is a pure function: the view below it only draws
// what this returns. It reads an experience's data fields and never its name.
//
// The six rules, in order:
//   1. filter by month, pace and suitability
//   2. score by interest order (first 3x, second 2x, third 1x) plus a small weight for local impact
//   3. route day 1 from the arrival base and move bases at most once
//   4. fill evening first, then morning, then afternoon
//   5. hold at most one paid session a day on a light pace and two on an immersive one
//   6. mark free time with a reason when nothing fits

import { hostsById, classify, hostLabel, inMonth } from './catalogue.js';

export const SLOTS = ['evening', 'morning', 'afternoon'];
export const PARTIES = ['couple', 'family-young-children', 'friends', 'study-group'];
export const PACES = ['light', 'immersive'];
export const PAID_CAP = { light: 1, immersive: 2 };

export const DEFAULT_INPUTS = {
  interests: ['craft', 'kitchen'],
  party: 'couple',
  month: new Date().getMonth() + 1,
  pace: 'light',
  nights: 3
};

/* A small deterministic shuffle, so two runs of one visit agree and two visits differ. */
function hash (text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

export function newSeed () {
  return Math.random().toString(36).slice(2, 10);
}

/* --- rule 1: what may be placed at all ----------------------------------- */

export function suits (item, party) {
  if (party === 'family-young-children' && item.suitability?.youngChildren === false) return false;
  if (party === 'study-group' && item.suitability?.lowMobility === false && item.layer === 'free') return false;
  return true;
}

export function candidates (items, byId, inputs) {
  return items.filter((item) => classify(item, byId) === 'bookable'
    && inMonth(item, inputs.month)
    && (item.pace || []).includes(inputs.pace)
    && suits(item, inputs.party));
}

/* --- rule 2: score ------------------------------------------------------- */

export function score (item, interests) {
  const weights = [3, 2, 1];
  let total = 0;
  interests.slice(0, 3).forEach((interest, i) => {
    if ((item.interests || []).includes(interest)) total += weights[i];
  });
  return total + (item.impactWeight || 0) * 0.25;
}

/* --- fair sharing: a host is not always named first ----------------------- */

export function chooseHost (item, hosts, byId, seed, index) {
  const ids = item.hostIds || [];
  if (ids.length === 0) return null;
  const turn = Math.floor(hash(`${seed}:${item.id}`) * ids.length + index) % ids.length;
  return hostLabel(byId.get(ids[turn]));
}

/* --- rule 3: the shape --------------------------------------------------- */

export function pickShape (journeys, inputs) {
  const sameLength = journeys.filter((j) => j.nights === inputs.nights);
  if (inputs.party === 'family-young-children') {
    const suitable = sameLength.filter((j) => j.suitability?.youngChildren !== false);
    if (suitable.length) return suitable[0];
  }
  if (inputs.party === 'study-group') {
    const oneBase = sameLength.filter((j) => new Set(j.days.map((d) => d.base)).size <= 2);
    if (oneBase.length) return oneBase[oneBase.length - 1];
  }
  return sameLength[sameLength.length - 1] || journeys[0];
}

/* --- the plan ------------------------------------------------------------ */

function reason (item, inputs, placesById, baseId) {
  const base = placesById.get(baseId);
  if (base && base.seasonText && /March to November/i.test(base.seasonText) && (inputs.month < 3 || inputs.month > 11)) {
    return `The ridge is closed by snow in this month, so the day stays open.`;
  }
  return 'Nothing bookable fits this session in the month you picked.';
}

export function plan (inputs, catalogue, seed = 'seed') {
  const opts = { ...DEFAULT_INPUTS, ...inputs };
  const byId = hostsById(catalogue.hosts);
  const placesById = new Map(catalogue.places.map((p) => [p.id, p]));
  const shape = pickShape(catalogue.journeys, opts);
  const pool = candidates(catalogue.experiences, byId, opts);
  const legs = catalogue.legs || [];

  const used = new Set();
  let moves = 0;
  let previousBase = null;

  const days = shape.days.map((dayShape, dayIndex) => {
    const baseId = dayShape.base;
    const base = placesById.get(baseId);
    const cap = PAID_CAP[opts.pace] ?? 1;
    let paid = 0;

    // rule 3: the bases move at most once. A town day is a day out, not a move.
    let travel = null;
    if (previousBase && baseId !== previousBase && base?.kind === 'base') {
      moves += 1;
      const leg = legs.find((l) => (l.from === previousBase && l.to === baseId) || (l.from === baseId && l.to === previousBase));
      travel = leg
        ? { text: leg.note || `${placesById.get(previousBase)?.name} to ${base.name}`, confirmed: leg.confirmed === true }
        : { text: `${placesById.get(previousBase)?.name} to ${base.name}`, confirmed: false };
      if (!travel.confirmed) travel.text = `About half a day: ${travel.text.charAt(0).toLowerCase()}${travel.text.slice(1)} The drive is not measured yet.`;
    }
    if (base?.kind === 'base') previousBase = baseId;

    // rule 4: evening first, then morning, then afternoon.
    const sessions = SLOTS.map((slot) => {
      const fits = pool
        .filter((item) => item.session === slot && item.base === baseId && !used.has(item.id))
        .filter((item) => !(item.paid && paid >= cap))
        .sort((a, b) => score(b, opts.interests) - score(a, opts.interests)
          || hash(`${seed}:${dayIndex}:${a.id}`) - hash(`${seed}:${dayIndex}:${b.id}`));

      const item = fits[0];
      if (!item) {
        // rule 6: free time always says why.
        return { slot, free: true, name: 'Free time', reason: reason(null, opts, placesById, baseId) };
      }
      used.add(item.id);
      if (item.paid) paid += 1;
      return {
        slot,
        free: false,
        id: item.id,
        name: item.name,
        host: chooseHost(item, catalogue.hosts, byId, seed, dayIndex),
        paid: item.paid,
        layer: item.layer,
        lengthText: item.lengthText
      };
    });

    return {
      day: dayShape.day,
      base: baseId,
      baseName: base?.name ?? baseId,
      note: dayShape.note,
      travel,
      sessions
    };
  });

  const notes = [];
  if (opts.party === 'family-young-children') {
    notes.push('With small children the walk in to the ridge is never scheduled, and the journey stays at the river base.');
  }
  if (moves > 1) notes.push('This shape moves base more than once. Ask us before you sell it.');
  if (pool.length === 0) {
    notes.push('Nothing in the catalogue is bookable in this month for this pace. The days are open and we will build them with you.');
  }

  return { journeyId: shape.id, name: shape.name, nights: shape.nights, inputs: opts, seed, days, notes, moves };
}

/* --- what a partner copies ------------------------------------------------ */

export function itineraryText (result, siteName = 'Chamba ke sang') {
  const lines = [`${siteName}: ${result.name}`, ''];
  for (const day of result.days) {
    lines.push(`Day ${day.day} · ${day.baseName}${day.note ? ` · ${day.note}` : ''}`);
    if (day.travel) lines.push(`  Travel: ${day.travel.text}`);
    for (const session of day.sessions) {
      const when = session.slot.charAt(0).toUpperCase() + session.slot.slice(1);
      const who = session.host ? ` with ${session.host}` : '';
      lines.push(`  ${when}: ${session.name}${session.free ? ` (${session.reason})` : who}`);
    }
    lines.push('');
  }
  for (const note of result.notes) lines.push(note);
  lines.push('Net rates on request from NotOnMap.');
  return lines.join('\n');
}
