# Proposal

## Why

NotOnMap has a product worth selling, Chamba ke sang, but nothing a tour operator, hotel or institution can open on a
phone and act on when the team is not there to explain it. The DoCC plan needs a live partner page by 1 Dec 2026
(Plan.xlsx 3.11), and outreach wave 1 goes out on 3 Dec.

## What Changes

- A static, mobile-first website for Chamba ke sang, built for partners first and travellers second.
- A partner switcher: the visitor picks their partner type (tour operator or DMC, experiential company, institution,
  local hotel or driver) and every section re-orders to what that partner can sell. A link can preset the type.
- A catalogue of stays and experiences, read from one data file that mirrors NotOnMap's Google Sheet, that shows only
  ready, consented items as bookable.
- A day planner that builds a 3-night or 6-night journey from the catalogue, using the six rules of the teammates'
  Journey Builder (filter, score, route, fill the day, fallback, share fairly).
- A two-base map (H2O House on the river, Mystic Village on the ridge) with Chamba town between them.
- A trust section: the homestay standard, the visitor code, and the Chamba Local Spend Record explained with a clearly
  hypothetical example.
- A hold-dates enquiry form that sends to NotOnMap and works without JavaScript failing silently.

## Capabilities

### New Capabilities
- `partner-offer`: what each partner type can sell, how they earn, and how a link presets the partner type.
- `product-catalogue`: the single source of stays, experiences and hosts, and the rules for what may be shown as bookable.
- `journey-planner`: building a day-by-day journey from the catalogue for a chosen pace, length and interests.
- `place-map`: showing where the two bases, Chamba town and the experiences are, and how far apart.
- `trust-and-record`: the homestay standard, visitor code and the Local Spend Record explainer, and the rules for
  what figures may be claimed.
- `enquiry-capture`: collecting a partner's hold-dates request and confirming it only after a real send.

### Modified Capabilities

## Impact

- New repository `chamba-ke-sang` with a static site (HTML, CSS, small JS), data files under `data/`, and photographs.
- Hosting on GitHub Pages; enquiries to a Google Apps Script endpoint NotOnMap owns (configured after handover).
- No change to notonmap.com; the site links to it for direct bookings.

## Out of scope

- Online payment, the payment ledger and automatic Local Spend Record generation (Phase 2 of the pilot).
- Prices: net rates show "on request" until NotOnMap approves a rate card.
- Saal Valley houses under renovation, Sel village (on hold) and Auda (community consent pending) as bookable items.
- A CMS, user accounts, or any server code beyond the form endpoint.
- Hindi translation (planned after v1).
