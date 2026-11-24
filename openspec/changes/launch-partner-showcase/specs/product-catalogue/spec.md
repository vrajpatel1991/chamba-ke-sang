# Spec Delta

## Purpose

Keeps every stay, experience and host in one editable source, and decides what the public may see as bookable, so the
site can never sell something that is not ready or not consented to.

## ADDED Requirements

### Requirement: One content source
All stays, experiences, hosts, journeys and site settings SHALL come from data files that mirror columns of NotOnMap's
Google Sheet. Changing a value in a data file SHALL change the site without editing page markup.

#### Scenario: Editing an experience
- **WHEN** NotOnMap changes an experience's name in the data file
- **THEN** every place that shows that experience shows the new name after the next publish

### Requirement: Bookable gate
An experience or stay SHALL be shown as bookable only if its readiness tier is 2 or higher AND consent is recorded for
every named person on it. Items at tier 1 with consent MAY be shown under "In development" without a booking action.
All other items SHALL NOT appear.

#### Scenario: Not consented
- **WHEN** an experience is tier 2 but its host's consent is not recorded
- **THEN** it does not appear anywhere on the site

#### Scenario: In development
- **WHEN** an experience is tier 1 with consent recorded
- **THEN** it appears only in the "In development" list, without a hold-dates action or a price

### Requirement: Named people
A host's name SHALL appear only when that person's consent covers "name on listings". Without it the experience SHALL
describe the host by role (for example "a Gaddi weaver from the women's self-help group").

#### Scenario: Name without consent
- **WHEN** an experience lists a host whose listing consent is not recorded
- **THEN** the role description is shown in place of the name

### Requirement: Status labels
Every visible item SHALL carry its base (H2O House, Mystic Village or Chamba town), its season, its typical length, and
whether it is an anchor, a pathway, free time or an encounter.

#### Scenario: Out of season
- **WHEN** a visitor filters by a month outside an experience's season
- **THEN** that experience is shown as unavailable for that month, with its season stated

### Requirement: Excluded content
The catalogue SHALL NOT contain visitor teaching at the school, rabbit photography, photographs of children, or any item
on the village's "not for sale" list.

#### Scenario: Data review
- **WHEN** the data files are checked before publish
- **THEN** a check fails if any item carries an excluded type
