# Spec Delta

## Purpose

Collects a partner's hold-dates request with enough detail for NotOnMap to reply within a day, and never tells the
partner it was sent when it was not.

## ADDED Requirements

### Requirement: Fields
The form SHALL ask for: organisation, contact name, email, phone or WhatsApp (optional), partner type, preferred
months, group size, nights, base or journey of interest, and a message. Partner type and journey SHALL be pre-filled
when the visitor arrives from a partner view or the planner.

#### Scenario: Arriving from the planner
- **WHEN** a visitor presses "Hold these dates" in the planner
- **THEN** the form opens with the journey summary in the message and the length and month filled in

### Requirement: Validation
Required fields SHALL be checked before sending, and each error SHALL appear under its own field in plain words.

#### Scenario: Missing email
- **WHEN** the visitor sends without an email
- **THEN** the form does not send and "Add an email so we can reply" appears under the email field

### Requirement: Real send only
The form SHALL show a confirmation only after the endpoint confirms receipt. If no endpoint is configured, or the send
fails, it SHALL say so and offer email to NotOnMap instead.

#### Scenario: No endpoint yet
- **WHEN** the site has no form endpoint configured
- **THEN** pressing send opens a pre-written email to NotOnMap with the same details, and no success message is shown

#### Scenario: Endpoint fails
- **WHEN** the endpoint returns an error
- **THEN** the visitor's entries stay in the form and a message offers the email route

### Requirement: Privacy
The form SHALL collect only the fields above and SHALL state in one line that details go to NotOnMap only.

#### Scenario: Privacy line
- **WHEN** the form is shown
- **THEN** a one-line privacy note is visible above the send button
