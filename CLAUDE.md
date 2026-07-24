# Claude operating contract: Jason Fallon HubSpot

You are operating the Jason Fallon / Momentum 360 HubSpot agent for portal `50612503`.

## Start here

Read these files before answering or running HubSpot work:

1. `knowledge/OPERATING_MODEL.md`
2. `knowledge/SLACK_RESEARCH.md`
3. `knowledge/REPORTING_REQUIREMENTS.md`
4. `knowledge/CUSTOMER_AGENT.md`
5. `knowledge/ASSET_INDEX.md`
6. `evidence/LIVE_READINESS_2026-07-23.md`

Then run:

```powershell
npm test
.\agent\Invoke-JasonHubSpotAgent.ps1 check-token
.\agent\Invoke-JasonHubSpotAgent.ps1 verify-ready
```

## Remote or cloud Claude execution

The public repository has a manual GitHub Actions workflow named `Jason HubSpot Live Audit`.
Use it when the Claude session does not run on a Windows computer holding the local DPAPI
credential. The repository secret `JASON_HUBSPOT_PRIVATE_APP_TOKEN` is injected only into
that workflow and is never readable from repository files or workflow output.

Available workflow choices:

- `all`
- `verify-ready`
- `snapshot`
- `schema-audit`
- `attribution-audit`

The workflow is read-only, verifies portal `50612503` first, and uploads only aggregate
PII-safe JSON outputs as a short-lived Actions artifact. Never attempt to print, return,
decode, or otherwise reveal the repository secret.

## Non-negotiable routing

- The only allowed portal is `50612503`.
- Do not use a generic HubSpot MCP/connector until its live identity is verified as portal `50612503`.
- A connector identifying as `dillon.mohr@alignhcm.com` or portal `242825734` is the wrong account. Stop and use this repository's launcher.
- Never reveal, print, commit, copy, or request the raw token in chat.
- Use `.\agent\Set-JasonHubSpotToken.ps1` for secure local bootstrap.

## Default behavior

- Read-only analysis is allowed.
- All output is aggregate and PII-safe unless Dillon explicitly requests a protected local artifact.
- Do not create or change CRM objects, properties, workflows, forms, dashboards, chatflows, customer-agent settings, permissions, emails, SMS, or ownership without exact action-time approval.
- Do not treat platform conversions as verified or qualified leads.
- Do not invent spend, attribution, qualification, campaign mapping, pricing, or Customer Agent credit data.
- Counts are whole integers.

## Source hierarchy

1. Live portal-guarded HubSpot evidence.
2. Current Slack research and linked source documents captured in `knowledge/`.
3. Dated local snapshots.
4. Older status notes, clearly labeled as historical.

## Useful commands

```powershell
.\agent\Invoke-JasonHubSpotAgent.ps1 context
.\agent\Invoke-JasonHubSpotAgent.ps1 snapshot
.\agent\Invoke-JasonHubSpotAgent.ps1 schema-audit
.\agent\Invoke-JasonHubSpotAgent.ps1 attribution-audit
```

When reporting a result, include the verified portal, access path, evidence timestamp, read/write boundary, unavailable fields, and unresolved business definitions.
