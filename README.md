# On Their Map

The website for **On Their Map** (उनके नक्शे पर), NotOnMap's 8-day community trip through three
valleys of Chamba, Himachal Pradesh. It is the brochure of the same name, built as a site: plain
HTML, CSS and a little JavaScript, with every day of the trip held in one data file.

**Live:** https://vrajpatel1991.github.io/chamba-ke-sang/

---

## The idea the site is built around

Eight days, eight **Marks**. Each day leaves one thing behind for people met by name. On every day
the impact comes first, then what you do, and where you sleep comes last. The same eight Marks are
funded by all five versions of the trip; only how you take part changes.

| Day | Mark | Valley |
|---|---|---|
| 1 | Keep a 3rd-century water mill turning | Saal Valley |
| 2 | Open a new door | Saal Valley |
| 3 | Carry a craft forward | Saal Valley and Chamba town |
| 4 | Be the first footprint | Dwat Mahadev |
| 5 | Keep the stove burning | Khajjiar |
| 6 | Take plastic off a mountain | Khajjiar |
| 7 | Teach something, learn something back | Khajjiar |
| 8 | Take a story home, leave yours behind | Khajjiar |

The five versions: give-back traveller, family, trekker, slow-down seeker, learning group.

## The pages

| File | What it is |
|---|---|
| `index.html` | the trip: what it is, which version fits you, the route through three valleys, your Map of Marks, and the form |
| `days.html` | the itinerary, day by day, in whichever version you pick |
| `privacy.html` | what the form collects |

A link can carry a version: `index.html?trip=trekker` and `days.html?trip=family` both open already
chosen, so you can send someone straight to the right one.

## Changing the trip

Everything a day says lives in **`data/trip.json`**. Edit it, then run one command:

```bash
node tools/build-data.mjs      # writes data/data.js, the one file the pages load
```

Forget that command and the site keeps showing yesterday's trip.

The file has two halves, and the split is the point:

- **`marks`** — the eight Marks. The valley, the Hindi line, the impact, the running count of people,
  where your share goes and where you sleep. These are the same in every version, so they are
  written once.
- **`trips`** — the five versions. Each has eight days with only a **title**, **what you do**,
  **who you meet** and the **swaps**. Change one of these and only that version changes.

So: to reword the impact of day 5, edit `marks`. To give trekkers a different day 5, edit
`trips → trekker → days[4]`.

Everything else on the page — the three promises, the practical facts, the Map of Marks counts, the
trust line and the contact details — is in the same file, near the bottom.

## What the form does today

**It does not send anywhere yet.** `js/form.js` carries `data-endpoint=""`, so pressing "Ask about
dates" opens the visitor's own email app with every answer in it, addressed to a stand-in address,
and the page never claims a request was sent.

To turn it on, put NotOnMap's Google Apps Script URL in the `data-endpoint` attribute in
`js/form.js` and change `hello@notonmap.example` to the real address. Both routes then work, and a
confirmation only appears once the endpoint actually answers.

## The photographs

Every photograph is NotOnMap's own, taken from the brochure PDF, in `assets/img/`. None is stock and
none is a stand-in. To replace one, drop a new file in beside it and change the `src` in the page.

| File | What it shows |
|---|---|
| `gharat` | H2O House and the stream that drives its water mill |
| `homestay` | a newly opened Saal Valley homestay |
| `chaminoo` | a village courtyard house, maize drying |
| `bonfire` | the fire outside a village house at dusk |
| `gaddi-door` | a Chamba town doorway with Gaddi figures painted either side |
| `chullah` | cooking on a wood-fired chullah |
| `campsite` | tents on the ridge at Dhaulapir |
| `luanchadi` | Gaddi dress on the last day |
| `cow` | a village morning |

## Checking it

```bash
node tools/check-scenarios.mjs        # 45 checks in a real browser, at 1440 and 390
node .claude/skills/design-taste-frontend/scripts/copy-lint.mjs index.html days.html --kind service
```

After a push, run the same checks against the published site:

```bash
node tools/check-scenarios.mjs --base https://vrajpatel1991.github.io/chamba-ke-sang/
```

`check-scenarios.mjs` walks the trip switcher, the eight days, the route, the Map of Marks and the
form, and fails if a day loses its Mark, if the people count stops growing, or if the form ever
claims to have sent something it did not. It needs Chrome installed; nothing else.

## Publishing

```bash
git add -A && git commit -m "Trip: <what changed>" && git push
```

GitHub Pages rebuilds within a minute or two. It caches hard, so add `?cb=1` when you check a change
straight after a push.

## What is still to settle

1. **The form endpoint** and the real reply address.
2. **The share of each trip that goes to each cause** — the site says it is fixed before you book,
   because it is not fixed yet.
3. **Travel times between the valleys**, which the brochure also leaves open.
4. **Dwat Mahadev** has no guests yet. Day 4 says so, and carries the Auda fallback for the seasons
   when the valley is not ready.
5. **A domain.** The canonical link in `index.html` is still a comment.
