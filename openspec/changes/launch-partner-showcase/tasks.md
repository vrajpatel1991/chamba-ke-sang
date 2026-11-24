# Tasks

## 1. Setup

- [ ] 1.1 Copy the taste-skill kit `assets/` into the project, create `index.html` from `starter.html`, and verify it opens locally with no console errors
- [ ] 1.2 Arm the finish gate (`gate.mjs --start index.html --kind place --category "village stays and craft sessions in Chamba" --primary "Hold dates"`) and verify `.taste-skill/build.json` exists
- [ ] 1.3 Deal the place hero, moments and lists, apply NotOnMap's colours with `start.mjs brand`, and record the deal at the top of `<body>`; verify the plan file lists kind, deal and palette reason

## 2. Content and data

- [ ] 2.1 Write all page copy in `copy/page.md` (voice card, h1 naming the category and buyer, one hard fact on screen one) and verify `copy-lint.mjs copy/page.md --kind place` has no FAIL
- [ ] 2.2 Create `data/*.json` from the project documents (partners, places, experiences with tier and consent, hosts with roles, journeys, settings, sourced figures) and verify every field the specs name is present
- [ ] 2.3 Write `tools/check-data.mjs` (bookable gate, consent on names, excluded types, sourced figures) with `node --test` cases for each spec scenario, and verify all pass
- [ ] 2.4 Write `tools/sheet-to-json.mjs` for CSV exports and verify a round trip of `experiences.json` through CSV is unchanged

## 3. Showcase page

- [ ] 3.1 Build the hero and the partner switcher (four types, `?p=` preset, address bar sync, default tour operator) and verify each scenario of `partner-offer` in the browser at 1440 and 390
- [ ] 3.2 Build the two-base photo chapters and the catalogue sections from data (bookable vs in development, roles when no consent) and verify a tier-1 item never shows a hold-dates action
- [ ] 3.3 Build the trust section (homestay standard, visitor code link, who is behind it, footer credits) and verify the footer names NotOnMap with one credit line

## 4. Journey planner

- [ ] 4.1 Implement `js/planner.js` with the six rules and seeded rotation, with `node --test` cases for young children, nothing fits, two cooks and session caps; verify all pass
- [ ] 4.2 Build the planner view (inputs, day cards with the running-stitch connector, copy itinerary, hold these dates) and verify the copied text has no prices and the form opens pre-filled

## 5. Map

- [ ] 5.1 Draw the SVG map from `places.json` with the stitch route, base selection and labelled distances; verify it renders with network access to third parties blocked and reads at 390 px

## 6. Enquiry and record pages

- [ ] 6.1 Build the enquiry form (fields, inline errors, endpoint send, mailto fallback, privacy line) and verify: no endpoint opens email, a failing endpoint keeps entries, success only on 2xx
- [ ] 6.2 Build `record.html` with the hypothetical printed-slip example (labelled, "payment" wording) and `visitor-code.html`; verify copy-lint passes and the word "benefit" does not appear in the record copy

## 7. Checks and polish

- [ ] 7.1 Run copy-lint, consistency, check.mjs, shoot at 1440/1024/820/768/390 and perf.mjs; fix every FAIL and verify `gate.mjs index.html` ends in `GATE: PASS` or `GATE: OPEN` with waivers written
- [ ] 7.2 Run one unslop audit on the final screenshots against `references/signs.md`; fix findings and verify none of the heavy-slop signs remain

## 8. Publish and handover

- [ ] 8.1 Write `README.md` (edit the Sheet, export, check, publish; where settings live) and verify a non-developer can follow it end to end on a copy of the repo
- [ ] 8.2 Publish to GitHub Pages and verify the live URL loads on a phone with `?p=institution` opening the institution view

## Workflow follow-up

- After NotOnMap supplies photographs, consent records, the rate card and the form endpoint, run 2.2's checks again and republish.
- Archive this change with `openspec archive launch-partner-showcase` once v1 is live.
