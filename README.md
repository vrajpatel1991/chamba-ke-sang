# Chamba ke sang — partner showcase

Static, mobile-first site that lets tour operators, DMCs, institutions and local hotels see what they can sell in Chamba
with NotOnMap, plan a 3- or 6-night journey, and hold dates.

## Where things are

- `openspec/` — the plan. Start with `openspec/changes/launch-partner-showcase/` (proposal, specs, design, tasks).
- `.claude/skills/` — skills used to build it: `design-taste-frontend` (taste-skill by Leonxlnx, MIT),
  `unslop` (by Damir Sokolovsky, @heydamir, CC BY 4.0), and the OpenSpec workflows.
- `data/` — all content (added in task 2.2). Edit the Google Sheet, export CSV, run the checks, publish.

## Continue in Claude Code

```bash
git clone <this repo> && cd chamba-ke-sang
claude
# then: /openspec-apply-change launch-partner-showcase
```

Requires Node 22+, Chrome or Chromium, and `npm install -g @fission-ai/openspec@latest`.
