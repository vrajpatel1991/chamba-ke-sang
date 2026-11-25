# Chamba ke sang

The partner website for Chamba ke sang, NotOnMap's village stays and craft sessions in Chamba
district, Himachal Pradesh. It is a plain static site: HTML, CSS and a little JavaScript, with every
stay, session, host and price held in `data/`. There is no account to keep, no server to pay for and
nothing to install but Node.

**Live:** https://vrajpatel1991.github.io/chamba-ke-sang/

---

## What you change, and what you never have to

| You want to | Change this |
|---|---|
| Add or edit a stay, a session or a host | the Google Sheet, then import it (below) |
| Turn an experience on or off | its `tier` and its hosts' `consent` in the Sheet |
| Change a price | the stay's `priceFrom` in `data/places.json` |
| Point the form at NotOnMap's inbox | `formEndpoint` in `data/settings.json` |
| Add the WhatsApp number | `whatsapp` in `data/settings.json` |
| Change the words on a page | the page's `.html` file, or `copy/page.md` first |
| Replace a stand-in photograph | drop the new file in `assets/img/` and change the `src` |

You never have to touch `assets/` (the design kit), `js/` (the logic) or `tools/` (the checks).

## The five minutes that publish a change

You need [Node 22 or newer](https://nodejs.org). Open a terminal in this folder and run, in order:

```bash
node tools/sheet-to-json.mjs experiences export/experiences.csv   # 1. the Sheet into the site
node tools/check-data.mjs                                         # 2. is it safe to publish?
node tools/build-data.mjs                                         # 3. make the file the pages read
git add -A && git commit -m "Catalogue: <what changed>" && git push   # 4. publish
```

GitHub Pages rebuilds the site within a minute or two of the push.

**Step 1** takes a CSV you exported from one tab of the Sheet (File → Download → Comma-separated
values). The tabs it knows are `experiences`, `hosts` and `partners`. Everything else — the two
bases, the journeys, the figures and the settings — is edited directly in `data/*.json`, because it
changes once a season rather than once a week.

**Step 2 is the one that matters.** It refuses to let the site publish something it should not:

- an experience sold while its readiness tier is below 2, or while a host has not consented;
- a person's name where that person has not consented to be named on listings;
- visitor teaching at the school, rabbit photography or anything else on the excluded list;
- a figure with no source, or one of the four unverified numbers from Plan.xlsx;
- a distance that does not say whether it is confirmed or approximate;
- a net rate while `rates.approved` is still `false`.

If it prints `FAIL`, read the line: it names the row and what is wrong. Fix the Sheet and run it
again. Nothing is published until it prints `data: ok`.

**Step 3** writes `data/data.js`, the one file every page loads. Forget it and the site keeps showing
yesterday's catalogue.

## Where the settings live

All of them are in `data/settings.json`:

| Setting | What it does | Today |
|---|---|---|
| `formEndpoint` | the Google Apps Script URL the hold-dates form posts to | empty |
| `mailFallback` | the address the form writes to while there is no endpoint | a stand-in on `.example` |
| `whatsapp` | the WhatsApp Business number | empty |
| `replyTime` | the promise under the form | "within a day" |
| `rates.approved` | set it to `true` only when NotOnMap has approved a rate card | `false` |
| `capacity` | the largest group each base can host, and whether that is confirmed | the ridge 12, the river unknown |

**The form does not send anywhere yet.** Until `formEndpoint` holds a URL, pressing "Hold dates"
opens the visitor's own email app with every answer in it, addressed to the stand-in address, and the
page never says a request was sent. Put the Apps Script URL in `formEndpoint`, put NotOnMap's real
address in `mailFallback`, and both routes start working.

## The rules the site keeps, so you do not have to remember them

- A stay or session is **bookable** only at tier 2 or above with every host's consent recorded.
  Tier 1 with consent shows under **In development**, with no price and no booking. Everything else
  is invisible.
- A host is **named** only where `consent.listing` is true. Otherwise the page shows their role.
- **Net rates are "on request"** everywhere until `rates.approved` is `true`.
- **Every figure carries a source** in `data/figures.json`. A figure without one is never drawn.
- The Local Spend Record copy says **payment**, never *benefit* or *impact*, and its example is
  labelled **Hypothetical example**.

## The pages

| File | What it is |
|---|---|
| `index.html` | the partner showcase: the two bases, how to reach them, what each partner sells, the catalogue and the hold-dates form |
| `journey.html` | the two bases as three photographs, and the shapes a journey takes |
| `plan.html` | the day planner |
| `catalogue.html` | everything bookable, and everything in development |
| `record.html` | the Chamba Local Spend Record |
| `visitor-code.html` | the five rules |
| `standard.html` | the homestay standard |
| `privacy.html`, `credits.html` | the legal row's two pages |

The small pages were written by `node tools/make-pages.mjs` from one shell, so every page carries the
same nav, footer and credits line. Edit the `.html` files directly if you like; running that command
again overwrites them.

## Checking the whole site

```bash
node --test tools/*.test.mjs        # the planner's rules and the data checks, 35 cases
node tools/check-scenarios.mjs      # every scenario the specs name, in a real browser
node .claude/skills/design-taste-frontend/scripts/copy-lint.mjs index.html --kind place
```

`check-scenarios.mjs` drives a headless Chrome over the two widths that matter, 1440 and 390, and
walks the partner switcher, the map, the catalogue, the planner and the form. It needs Chrome
installed; nothing else.

## What NotOnMap still has to supply

1. **Photographs.** Every picture on the site today is a licensed stand-in from Wikimedia Commons of
   the real district or the real craft — never of H2O House or Mystic Village. The frames waiting for
   a real photograph carry a `data-slot` with the file name expected. The shot list is in
   `.taste-skill/plan.md`.
2. **Consent.** `data/hosts.json` ships with consent recorded only for the providers already selling
   on notonmap.com. Every named host is waiting on the December field round.
3. **The form endpoint** and **the WhatsApp number**.
4. **The rate card**, after which `rates.approved` becomes `true`.
5. **H2O House's facts**: the village, the rooms and the road time from Chamba. Until they are
   confirmed the site says so on the page.

## Licence and credits

The photographs are credited in one line in the footer, which opens `credits.html`. The design system
in `assets/` comes from the taste-skill kit and is not edited here.
