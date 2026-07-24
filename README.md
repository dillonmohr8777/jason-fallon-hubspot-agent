# Jason Fallon HubSpot Agent

The main, portable HubSpot operator for Jason Fallon and Momentum 360.

Confirmed account boundary: HubSpot portal `50612503`.

This repository gives Codex and Claude the same:

- Jason-only portal guard
- protected local-token launcher
- live API readiness verification
- PII-safe aggregate snapshots
- schema and attribution audits
- Slack and document-derived operating requirements
- customer-agent and CallRail boundaries
- other-computer setup
- original Slack reporting PDFs and brief under `source-documents/`

It intentionally does not contain a HubSpot token, DPAPI blob, cookie, password, one-time code, raw CRM export, or contact-level lead data.

## Current machine

```powershell
npm test
.\agent\Invoke-JasonHubSpotAgent.ps1 check-token
.\agent\Invoke-JasonHubSpotAgent.ps1 verify-ready
.\agent\Invoke-JasonHubSpotAgent.ps1 snapshot
.\agent\Invoke-JasonHubSpotAgent.ps1 schema-audit
.\agent\Invoke-JasonHubSpotAgent.ps1 attribution-audit
```

The launcher can use the existing protected Jason token on Dillon's current Windows profile. It never accepts the generic Align environment variable.

## Claude on the other computer

Claude Code should clone this private repository, open the repository root, and follow `CLAUDE.md`.

```powershell
gh repo clone dillonmohr8777/jason-fallon-hubspot-agent
Set-Location .\jason-fallon-hubspot-agent
.\scripts\Setup-ClaudeComputer.ps1
```

Windows DPAPI credentials are machine/user local and are never committed. The setup script prompts securely for the Jason/Momentum private-app token on the other computer, validates portal `50612503`, stores it encrypted for that Windows user, and runs the readiness gate.

If the other computer cannot obtain the token, Claude still has the complete operating context and can run tests, but live HubSpot commands remain correctly blocked.

## Read first

1. `CLAUDE.md`
2. `knowledge/OPERATING_MODEL.md`
3. `knowledge/SLACK_RESEARCH.md`
4. `knowledge/REPORTING_REQUIREMENTS.md`
5. `knowledge/CUSTOMER_AGENT.md`
6. `knowledge/ASSET_INDEX.md`
7. `evidence/LIVE_READINESS_2026-07-23.md`

## Status semantics

- `readyForReadReporting: true` means the token matched portal `50612503` and every required read endpoint passed.
- Optional failures such as Conversations or Workflows describe scope/product gaps; they do not grant permission to work around those gaps.
- No readiness result authorizes HubSpot writes.
