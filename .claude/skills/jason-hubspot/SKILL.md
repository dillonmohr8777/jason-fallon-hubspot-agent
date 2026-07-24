---
name: jason-hubspot
description: Operate the Jason Fallon and Momentum 360 HubSpot agent for portal 50612503 with strict account isolation and read-only defaults.
---

# Jason HubSpot

Read the repository `CLAUDE.md` and every file it lists under `knowledge/`.

Before live work:

1. Run `npm test`.
2. Run `.\agent\Invoke-JasonHubSpotAgent.ps1 check-token`.
3. Run `.\agent\Invoke-JasonHubSpotAgent.ps1 verify-ready`.
4. Stop on any portal other than `50612503`.

Use only the repository launcher. Do not use an unverified generic HubSpot connector.

Default to aggregate read-only analysis. Never expose secrets or commit contact-level PII.
