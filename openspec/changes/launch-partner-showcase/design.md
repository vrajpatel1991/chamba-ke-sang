# Design

## Context

Greenfield repository. Source material is the claude.ai project "DoCC - NotonMaps" (reports, People's Profile, Saal
Valley mapping, Plan.xlsx), the two strategy docs written in that project (B2B Master Execution Strategy; Chamba ke sang
Strategic Proposal) and notonmap.com listings. NotOnMap must be able to run the site alone after 5 Dec 2026. Partners
open it on phones over slow networks. See proposal.md for the why.

## Goals / Non-Goals

**Goals:**
- One static page set that passes the design-taste-frontend gate (`GATE: PASS` or `GATE: OPEN` with every waiver
  explained) and an unslop audit with no heavy-slop findings.
- Content editable as data, checked by a script before publish.
- First screen under 200 KB of critical weight on a phone; full page usable on a slow 3G profile.

**Non-Goals:**
- No framework, build step or package a non-developer must install to edit content.
- No client-side analytics beyond campaign tags in links (NotOnMap reads them from the form submissions).

## Decisions

**1. Plain static HTML, CSS and small ES modules, started from the taste-skill kit.**
The kit's `starter.html`, `system.css`, `system.js` and motion layer give a checked baseline (tokens, buttons, forms,
focus, reduced motion). Alternatives: Astro (adds a build step NotOnMap cannot maintain), Lovable/React (heavier, and
the content would live in code). Pages: `index.html` (partner showcase with planner), `record.html` (Local Spend
Record explainer), `visitor-code.html`.

**2. Page kind "place", with a partner layer.** taste-skill classes a guesthouse or small hotel as a place: photographs
lead, flat colour, type moments, no shader effects. Chamba ke sang is hospitality run from two places, so "place" fits;
the partner switcher is a section of our own built from the kit's components. Alternative "service" was rejected
because it pushes people-hired framing (agency, studio) and away from photographs of the places.

**3. Direction (unslop's five lines), fixed before any build.**
- Product: two village bases in Chamba where partners send guests to learn a craft, a kitchen or a ridge from the people
  who keep them.
- Character: unhurried, exact, warm-handed.
- World: slate roofs, deodar, mud-washed walls, Chamba Rumal thread on cloth.
- Moments: (a) the photo chapters of the two bases; (b) the Local Spend Record shown as a real-looking printed slip.
- Signature: a single fine running-stitch line (rumal embroidery) used as the route line between the two bases on the
  map and as the day-to-day connector in the planner, and nowhere else.
Colours: NotOnMap's charcoal and yellow as the client's own brand through `start.mjs brand`; yellow is the accent on dark
ink, never text on white. Type dealt by the kit for a place.

**4. Content as JSON in `data/`, mirrored from the Google Sheet.** Files: `settings.json`, `partners.json`,
`places.json`, `experiences.json`, `hosts.json`, `journeys.json`, `figures.json`. A Node script `tools/sheet-to-json.mjs`
converts a CSV export of each sheet tab; `tools/check-data.mjs` enforces the bookable gate, consent on names, excluded
types and sourced figures, and fails the publish. Alternative: reading the published Sheet live in the browser (rejected:
one network dependency on slow links, and no check step before publish).

**5. Planner as a pure function plus a thin view.** `js/planner.js` exports `plan(inputs, catalogue, seed)` with the six
rules; the view renders days and the copy block. Rotation uses a seed stored per visit so two runs differ but one visit
stays stable. Unit-tested with Node's built-in test runner, no dependencies.

**6. Map as inline SVG drawn from `places.json` coordinates projected to a fixed frame.** No map service, no API key,
readable at 390 px. The running-stitch line joins the bases.

**7. Form with progressive enhancement.** A real `<form>` posts to `settings.formEndpoint` (Google Apps Script). With no
endpoint, or on failure, it builds a `mailto:` to NotOnMap with the same fields. Success is shown only on a 2xx response.

**8. Checks.** taste-skill scripts (copy-lint, consistency, check, perf, gate) run against `index.html`; `node --test` for
the planner and data checker; one unslop audit pass on the final screenshots.

## Risks / Trade-offs

- [No real photographs in the repo yet] → Build with clearly listed stand-in slots (`data-slot` with the file name
  expected), never pass stock off as the place; the gate report lists every stand-in until Chalo Chamba and NotOnMap
  files are added.
- [Consent records not yet collected] → The data ships with consent false for named people, so names fall back to roles
  until NotOnMap fills the consent columns.
- [H2O House facts unconfirmed: village, rooms, host name] → Shown only as "river base near Chamba" with its listed
  description and a link to its notonmap.com page.
- [Rate card not approved] → "Net rates on request" everywhere; the data has a `rates` block that renders only when
  `approved: true`.
- [taste-skill gate strictness vs a partner-first layout] → Any FAIL judged false is waived in `.taste-skill/waivers.json`
  with its reason, never gamed.

## Migration Plan

Publish to GitHub Pages from the `main` branch. Rollback is reverting the commit. Handover: NotOnMap edits the Sheet,
exports CSV, runs one command (`node tools/publish.mjs`) or asks a volunteer; documented in `README.md`.

## Open Questions

- Final domain or subdomain (GitHub Pages URL works until then).
- WhatsApp Business number and the Apps Script endpoint (both are settings; the site works without them).
