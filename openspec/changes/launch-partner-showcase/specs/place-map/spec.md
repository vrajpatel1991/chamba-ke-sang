# Spec Delta

## Purpose

Shows a partner where the two bases, Chamba town and the experiences sit relative to Pathankot, Dalhousie and Khajjiar,
and how a guest gets there, without exposing household addresses.

## ADDED Requirements

### Requirement: Places shown
The map SHALL show H2O House (river base), Mystic Village (ridge base), Chamba town, Khajjiar and Dalhousie, and the
arrival points Pathankot and the Chamba bus stand. It SHALL NOT show a household's exact location.

#### Scenario: Selecting a base
- **WHEN** a visitor selects Mystic Village
- **THEN** the map highlights it and lists how to arrive (road to Rota, then about a 2 km walk) and the experiences based there

### Requirement: Works without a map service
The map SHALL render as a drawn diagram that needs no third-party map service or API key, and SHALL remain readable at
390 px wide.

#### Scenario: Offline service
- **WHEN** the visitor's network blocks external map tiles
- **THEN** the map still renders completely

### Requirement: Distances are labelled
Every distance or drive time SHALL say whether it is confirmed or approximate.

#### Scenario: Approximate distance
- **WHEN** a drive time has not been measured
- **THEN** it is shown with "about" and listed as approximate
