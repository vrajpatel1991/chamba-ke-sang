# Chamba ke sang — build plan

**Line 1 — kind:** place (`<html data-type="place">`, `<meta name="site-kind" content="other">`,
`<meta name="page-kind" content="place">`). Two village bases people come to, run as hospitality, so the
door decides: place, not service.

**Line 2 — the deal.** Hero: the place hero (printed, never dealt). Nav `nav-cards`. Footer
`footer-visit`. Rhythm `surface-pairs`. Buttons `arrow`. Mark `ring`. Offer composition `pair`. Place
composition `story`. Type moment `address` (re-dealt from `name`, reason below). Rooms layout `row`.
Type pairing `source-serif` (Source Serif 4 / Libre Franklin), the first `start.mjs deal --page place
--trade guesthouse` printed; a serif head suits a guesthouse.

**Palette — the client's own, through `start.mjs brand`, not a dealt palette.** NotOnMap's charcoal and
yellow: `--p-bg #f1ece3`, `--p-surface #e6dfd2`, `--p-ink #22211e`, `--p-accent #f2b705`. Why it fits:
the ground is the mud-washed wall of a Gaddi house and the ink the slate of its roof, so the
photographs of the valley sit on the material the houses are built from; the yellow is NotOnMap's own
mark, and `brand` keeps it off white — it is the accent on the dark ink (`--p-inv-action`), while the
primary button takes the charcoal.

**Re-dealt parts and why.** The type moment came up `name`, which makes the close `close-word`. The
booking form stands in place of the close on this page (a place takes its booking last, before the
footer), so there is no close to carry the name: re-dealt to `address`, which sets Chaminoo, Barour,
Chamba large under the visit h2. No street is in the brief, so the district alone is set and the map
link reads "See the area".

**Moments** (`moments.mjs pick --page place --count 2 --fits section,statement --photo`, seed e1034b56):
1. `picture-develops` — index, the booking section's photograph.
2. `photo-chapters` — journey.html, the two bases.
The design named the Local Spend Record slip as a moment; the kit has no slip moment, so the Record is
a designed block on `record.html` and `picture-develops` takes the dealt place instead.

## Pages

Split so each page stays inside the place plan's 3 to 6 screens (`consistency.mjs` SR-1). The specs put
about fifteen screens on one page; the planner and the two bases' photo chapters move to `journey.html`
and carry a journey into index's form by query string.

### index.html — the partner showcase (6 screens)

| # | id | one idea | picture | kind | screens |
|---|---|---|---|---|---|
| 1 | hero | village stays and craft sessions in Chamba, for the people who sell Himachal | Landscape of Chamba, full bleed under the header | place hero | 1 |
| 2 | `#visit` | how a guest reaches each base, and how far apart they are | the drawn SVG map, 6/6 beside the panel | diagram | 1 |
| 3 | `#offer` | what each kind of partner can sell, to whom, and how they earn | the switcher and its answers | type | 1 |
| 4 | `#catalogue` | what is bookable now, and what is still in development | `pair`: a Chamba Rumal and a loom warp, span-6 | photo | 1 |
| 5 | `#hold` | hold dates with NotOnMap | a 4:3 photograph, span-6, beside the form (`picture-develops`) | photo | 1 |
| 6 | `footer.closing` | where it is, who runs it | the address set wide | type | 1 |

Tablet (768, 820): sections 3 and 4 stack to two screens there; written on each section.

### journey.html — the two bases and the day planner (6 screens)

| # | id | one idea | picture | kind | screens |
|---|---|---|---|---|---|
| 1 | hero | a 3-night or 6-night journey built from what is ready | slate roof, chimney smoke, the ridge behind | place hero | 1 |
| 2 | `#bases` | the river base, the walk in, the ridge base | `photo-chapters`, three frames | photo | 3 |
| 3 | `#planner` | the day-by-day journey, built from the catalogue | the day list, the running-stitch connector | type | 1 |
| 4 | `footer.closing` | hold these dates | the name set wide (`close-word`) | type | 1 |

### Small pages

- `record.html` — the Chamba Local Spend Record, with one hypothetical printed slip.
- `visitor-code.html` — the five rules, given before arrival.
- `standard.html` — the homestay standard every bookable stay meets (one tap from each stay).
- `credits.html` — written by `photos.mjs credits --write`.
- `privacy.html` — the one line the footer's legal row needs.

## Photographs

No client photographs yet. Every frame below is a licensed Wikimedia Commons **stand-in** of the real
district or the real craft, listed in the report with the photograph NotOnMap must supply in its place;
nothing on the page says so. No frame is passed off as H2O House or Mystic Village: the two bases carry
`data-slot` with the file name expected.

| id | what it shows | where |
|---|---|---|
| f175556812 | the Chamba valley and town at dusk | index hero |
| f191160298 | a slate roof, chimney smoke, the ridge behind | journey hero |
| f168630397 | the Ravi valley before the monsoon | chapter 1, the river |
| f60444937 | a deodar grove | chapter 2, the walk in |
| f185667234 | a mud-washed village house | chapter 3, the ridge |
| f76159320 | a Chamba Rumal, double-satin embroidery | catalogue, `pair` left |
| f182167637 | a warp on a wooden loom | catalogue, `pair` right |
| f202409113 | maize drying on a slate roof | index `#hold` |

Dropped after the full-size look: Khajjiar meadow (cows, people, a recognisable viewpoint), the siddu
plate (a phone's brand burnt into the frame), two village houses (a readable water-tank brand, a flat
grey sky), every Gaddi shepherd frame (faces shown as hosts) and the Minjar crowd frames.

## Voice card

```
Voice: field-report (copy-registers.md) — a person who has walked the route writing to a buyer
Pairs: exact, not cold; plain, not folksy; it says what is not ready
Person: "you" for the partner, "we" for NotOnMap, the hosts named only with consent
Sentences: mostly 8 to 18 words; one longer where it explains the money
Humour: none
House words: base, session, host, night, tier, bookable, in development, net rate, payment
Never: untouched, authentic, hidden gem, impact, empower, transform, a figure without a source
```
