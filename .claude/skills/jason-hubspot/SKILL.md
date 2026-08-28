---
name: jason-hubspot
description: Operate the Jason Fallon and Momentum 360 HubSpot agent for portal 50612503 with strict account isolation and read-only defaults.
---

# Jason HubSpot

Read the repository `CLAUDE.md` and every file it lists under `knowledge/`.

Before live work:

1. Run `npm test`.
2. Run `npm run check` or `.\agent\Invoke-JasonHubSpotAgent.ps1 check-token`.
3. Run `npm run verify` or `.\agent\Invoke-JasonHubSpotAgent.ps1 verify-ready`.
4. Run `npm run health` when the user asks for daily or degraded status.
5. Stop on any portal other than `50612503`.
6. Treat `status: degraded` as the correct label when required CRM reads pass and Conversations or another optional probe fails.

Use only the repository launcher. Do not use an unverified generic HubSpot connector.

Default to aggregate read-only analysis. Never expose secrets or commit contact-level PII.
