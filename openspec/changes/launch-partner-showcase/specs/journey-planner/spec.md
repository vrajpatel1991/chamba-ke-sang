# Spec Delta

## Purpose

Turns a visitor's interests, pace, month and length into a day-by-day Chamba ke sang journey built only from bookable
catalogue items, so a partner can see and copy a realistic itinerary without talking to anyone.

## ADDED Requirements

### Requirement: Inputs
The planner SHALL take: up to three interests in order of preference (craft, kitchen, nature, culture and faith, adventure,
rest), who is travelling (couple, family with young children, friends, study group), month, pace (light or immersive) and
length (3 nights or 6 nights).

#### Scenario: Defaults
- **WHEN** the planner first loads
- **THEN** it shows a 3-night light journey for a couple in the current or next open month, with interests craft and kitchen

### Requirement: Rules read from data, never from names
The planner SHALL choose experiences only from their data fields (interests, month, pace, suitability, base, session,
impact weight). It SHALL apply, in order: filter by month, pace and suitability; score by interest order (first 3x,
second 2x, third 1x) plus a small weight for local impact; route day 1 from the arrival base and move bases at most once;
fill evening first, then morning, then afternoon; hold at most one paid session a day on a light pace and two on an
immersive pace; mark free time with a reason when nothing fits.

#### Scenario: Young children
- **WHEN** "family with young children" is chosen
- **THEN** no experience marked unsuitable for young children appears, and the ridge walk-in is not scheduled

#### Scenario: Nothing fits
- **WHEN** no bookable experience fits a session
- **THEN** that session shows "Free time" with a one-line reason, never an empty slot

### Requirement: Fair sharing
When an experience or stay is offered by more than one host, the planner SHALL rotate hosts across generated journeys so
that no host is always first.

#### Scenario: Two cooks
- **WHEN** two consented cooks offer the same session and the planner is run twice
- **THEN** different cooks are named first in the two journeys

### Requirement: Output
The planner SHALL show each day with its base, its sessions in order and the free time, a short "what partners copy"
text block that can be copied to the clipboard, and a "Hold these dates" action that carries the journey into the
enquiry form.

#### Scenario: Copy for partners
- **WHEN** a partner presses "Copy itinerary"
- **THEN** a plain-text itinerary without NotOnMap prices is placed on the clipboard and a short confirmation is shown

### Requirement: Honest placeholders
Travel times not yet measured in the field SHALL be shown as approximate and SHALL NOT be presented as exact.

#### Scenario: Unmeasured drive
- **WHEN** a day includes a move between bases whose drive time is not confirmed
- **THEN** the drive is labelled "about" and the confirmed flag is false in the data
