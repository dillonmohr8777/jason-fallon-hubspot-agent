# Jason Fallon / Momentum 360 HubSpot operating model

Updated: 2026-07-23

## Identity and access

- Account: Jason Fallon / Momentum 360
- Required HubSpot portal: `50612503`
- Current approved API path: Jason-specific private-app token loaded through the repository launcher
- Current-machine secret protection: Windows DPAPI, current Windows user
- Claude other-computer path: clone the private repository, securely bootstrap the same Jason private-app token locally, and validate portal `50612503`
- Native Codex HubSpot connector observed on 2026-07-23: portal `242825734`, user `dillon.mohr@alignhcm.com`
- Result: the native connector is quarantined for this agent until its live identity becomes `50612503`

Never copy the DPAPI blob to another computer. DPAPI encryption is user/machine local. Never commit or display the raw token.

## What the main agent owns

The main agent is the source-of-truth operator for:

- portal and scope readiness
- contact, company, deal, lead, activity, owner, pipeline, form, and schema inspection
- aggregate CRM health
- channel-attribution readiness
- sales-performance reporting readiness
- CallRail and campaign-mapping gaps
- Customer Agent readiness and fallbacks
- workflow and ownership design before approved implementation
- Claude/Codex parity through the same repository

## Read-only default

The repository implements only identity checks and read-only API calls. HubSpot search uses POST because HubSpot's Search API requires POST; it is still non-mutating.

No command creates or changes:

- contacts, companies, deals, leads, notes, calls, meetings, or tasks
- properties or schemas
- workflows
- forms
- reports or dashboards
- owners or teams
- Customer Agent, chatflows, inbox settings, credits, or knowledge sources
- email or SMS
- permissions, seats, or account settings

## Current confirmed coverage

Live readiness on 2026-07-23 confirmed portal `50612503` and successful reads for:

- contacts
- companies
- deals
- owners
- five deal pipelines
- fourteen forms
- calls
- meetings
- tasks

Historical schema evidence from 2026-06-26 showed:

- 534 contact properties
- 327 deal properties
- 267 company properties
- 109 call properties
- 114 meeting properties

Historical counts are context, not current truth. Run `snapshot`, `schema-audit`, and `attribution-audit` for current evidence.

## Known product/scope gaps

Historical probes showed:

- Conversations endpoints: missing scopes
- Workflows endpoint: missing `automation-access`
- CRM reads: available

The current readiness command rechecks those endpoints as optional probes. A failure remains visible. It must not be treated as permission to bypass HubSpot controls.

## Business state model

Keep these states separate:

1. Raw platform activity
2. Platform conversion
3. CRM lead/contact
4. Verified production lead
5. Qualified lead under an approved definition
6. Meeting booked
7. Opportunity created
8. Closed deal
9. Revenue collected or recognized

Do not collapse these into a single "conversions" number.

## Required handoff format

Every live agent result should state:

- portal ID
- access path used
- evidence timestamp
- read/write boundary
- reporting window and timezone when applicable
- sources checked
- unavailable or stale sources
- exclusion and reconciliation status
- unresolved business definitions
- output path
