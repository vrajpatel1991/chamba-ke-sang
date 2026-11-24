# Spec Delta

## Purpose

Lets a B2B partner see, within one phone screen, what Chamba ke sang gives them to sell, to whom, how they earn, and
how to act, tailored to the kind of partner they are.

## ADDED Requirements

### Requirement: Partner types
The site SHALL offer four partner types: tour operator or DMC, experiential travel company, institution or CSR team,
and local hotel or driver (Dalhousie and Khajjiar). A visitor who has chosen none SHALL see the tour operator view.

#### Scenario: Default view
- **WHEN** a visitor opens the home page with no partner type in the link
- **THEN** the tour operator view is shown and the switcher marks it as selected

#### Scenario: Switching type
- **WHEN** the visitor selects "Institution or CSR team"
- **THEN** the offer, sample journey, group size and main action change to that type without reloading the page, and the
  choice is reflected in the address bar so the link can be shared

### Requirement: Preset by link
A link carrying a partner type (for example `?p=institution`) SHALL open that view. Links MAY carry campaign tags,
which the site SHALL ignore for display.

#### Scenario: Shared link
- **WHEN** an operator opens a link with `?p=hotel&utm_source=wave1`
- **THEN** the local hotel view is shown first

#### Scenario: Unknown type
- **WHEN** the link carries an unknown partner type
- **THEN** the default view is shown and no error is displayed

### Requirement: The six partner questions
Each partner view SHALL answer, in this order: what they can sell; who buys it; how they earn; whether it fits their group
and month; why they can trust it; how to hold dates.

#### Scenario: Earnings without prices
- **WHEN** no approved rate card exists in the data
- **THEN** the earnings line explains the model (net rate plus the partner's own markup, or a per-guest referral fee for
  local hotels) and shows "Net rates on request" instead of any number

#### Scenario: Capacity is honest
- **WHEN** a partner type's typical group is larger than the bookable capacity in the catalogue
- **THEN** the view states the maximum group that can be hosted now and does not imply more

### Requirement: Main action
Every partner view SHALL have one main action, "Hold dates", leading to the enquiry form with the partner type already
filled in, and one secondary action, "Message on WhatsApp", when a WhatsApp number is configured.

#### Scenario: No WhatsApp number yet
- **WHEN** no WhatsApp number is set in the site settings
- **THEN** the secondary action is not shown
