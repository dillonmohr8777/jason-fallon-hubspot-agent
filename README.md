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
npm run check
npm run verify
npm run window
npm run health
npm run snapshot
npm run audit
```

Windows DPAPI token loading still goes through `.\agent\Invoke-JasonHubSpotAgent.ps1`. Cloud and Linux sessions should call the `npm run` scripts after `JASON_HUBSPOT_PRIVATE_APP_TOKEN` is already in the environment.

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

## Claude in a remote or cloud session

Use the repository's manual `Jason HubSpot Live Audit` GitHub Actions workflow. The workflow
receives the Jason credential from the protected `JASON_HUBSPOT_PRIVATE_APP_TOKEN` repository
secret, verifies portal `50612503`, and runs only the read-only aggregate commands.

The secret is not stored in Git and cannot be read back from GitHub. Forked pull requests do
not receive it. Live outputs are uploaded as 14-day aggregate audit artifacts.

## Read first

1. `CLAUDE.md`
2. `knowledge/OPERATING_MODEL.md`
3. `knowledge/SLACK_RESEARCH.md`
4. `knowledge/REPORTING_REQUIREMENTS.md`
5. `knowledge/CUSTOMER_AGENT.md`
6. `knowledge/ASSET_INDEX.md`
7. `evidence/LIVE_READINESS_2026-07-23.md`

## Status semantics

- `status` is `ready`, `degraded`, or `unavailable`.
- `ready` means the token matched portal `50612503` and every required and optional probe passed.
- `degraded` means required CRM reads passed and at least one optional probe failed. Daily Slack reports should keep this label instead of calling the portal ready.
- `unavailable` means a required probe failed or the portal guard failed.
- `readyForReadReporting: true` still means only that required read endpoints passed. It can be true while `status` is `degraded`.
- Optional failures such as Conversations describe scope/product gaps; they do not grant permission to work around those gaps or to report those counts as zero.
- `window-report` and `daily-health` provide the last-24-hour America/New_York aggregate that the older launcher was missing. Missing created-versus-updated splits, conversations, handoffs, and tickets stay unavailable.
- No readiness result authorizes HubSpot writes.
