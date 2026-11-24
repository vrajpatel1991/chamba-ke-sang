# Spec Delta

## Purpose

Gives partners and guests reasons to trust the product (homestay standard, visitor code, who is behind it) and explains
the Chamba Local Spend Record without making claims the evidence cannot support.

## ADDED Requirements

### Requirement: Verified figures only
Any number shown as a fact SHALL carry a source in the data, and SHALL NOT include the unverified figures listed in the
project context. Numbers used to illustrate the Local Spend Record SHALL be labelled "Hypothetical example".

#### Scenario: Unverified figure in data
- **WHEN** a figure in the data has no source or is marked unverified
- **THEN** it is not rendered

#### Scenario: Sample record
- **WHEN** the Local Spend Record section is shown
- **THEN** its example carries a visible "Hypothetical example" label and the words "payment" and "paid", never "benefit" or
  "impact", describe what the numbers measure

### Requirement: Homestay standard
The site SHALL list the standard every bookable stay meets: registration under the Himachal Pradesh Home Stay Rules 2025,
private or clearly disclosed shared bathroom, filtered drinking water, a named contact on call, a written emergency plan.

#### Scenario: Standard shown with stays
- **WHEN** a partner reads about a stay
- **THEN** the standard is reachable from that stay in one tap

### Requirement: Visitor code
The site SHALL show the visitor code: ask before every photo, follow each house's rules, carry waste out, no cash or
sweets for children, enter shrines and kitchens only when invited.

#### Scenario: Code before enquiry
- **WHEN** a visitor opens the enquiry form
- **THEN** a link to the visitor code is visible above the send button

### Requirement: Who is behind it
The site SHALL state that Chamba ke sang is run by NotOnMap with the host families and village groups of Mystic Village
and H2O House, and SHALL link to notonmap.com.

#### Scenario: Footer
- **WHEN** a visitor reaches the footer
- **THEN** it names NotOnMap, links to notonmap.com and carries one line of photograph credits
