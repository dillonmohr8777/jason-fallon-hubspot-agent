# Live readiness evidence

Evidence collected: 2026-07-23 8:02 PM America/New_York
HubSpot API timestamps: 2026-07-24T00:00Z through 2026-07-24T00:02Z

## Account routing

- Jason launcher credential: valid
- Verified portal: `50612503`
- Account: Jason Fallon / Momentum 360
- Access path: Jason-specific Windows DPAPI credential through `Invoke-JasonHubSpotAgent.ps1`
- Native Codex HubSpot connector: portal `242825734`, Align HCM user
- Routing decision: native connector is not allowed for Jason work

## Readiness

- Ready for read/reporting: yes
- Ready for writes: no
- Required read-probe failures: none
- Conversations: blocked by missing scopes
- Workflows: blocked by missing `automation-access`

Successful required probes:

- contacts
- companies
- deals
- owners
- deal pipelines
- forms
- calls
- meetings
- tasks
- contact schema
- company schema
- deal schema

## Current aggregate inventory

| Object | Count |
|---|---:|
| Contacts | 14,262 |
| Companies | 6,730 |
| Deals | 1,574 |
| Calls | 2,948 |
| Meetings | 212 |
| Tasks | 2,680 |
| Owners | 9 |
| Forms | 14 |
| Deal pipelines | 5 |

Pipelines:

- Google Suspensions
- Sales Pipeline
- Legacy Pipeline
- Website Leads
- META Leads

## Current schema inventory

| Object | Properties |
|---|---:|
| Contacts | 536 |
| Deals | 327 |
| Companies | 243 |
| Calls | 114 |
| Meetings | 119 |

The account already has useful source fields such as original/latest traffic source and drill-downs, first/last CallRail contact source, campaign, medium, and tracking number, CallRail lead score, GCLID, Google/Facebook click IDs, meeting-booked attribution, lifecycle stage, lead status, owner, pipeline, deal amount, close date, and closed-won state.

It does not have an approved normalized field set for all nine required channels.

## PII-safe provisional attribution audit

- Contacts audited: 14,262
- Deterministic mapping coverage: 19.29%
- Needs Review: 11,511

| Provisional channel candidate | Contacts |
|---|---:|
| Website | 332 |
| YouTube | 0 |
| Social Media (Facebook and Instagram) | 174 |
| META Suspensions | 412 |
| META AEO (VSL) | 0 |
| Google Ads Campaign #1 (Suspensions) | 18 |
| Google Ads Campaign #2 (Suspensions) | 0 |
| Cold Email | 0 |
| Phone Calls (CallRail) | 1,815 |
| Needs Review | 11,511 |

These are mapping candidates, not approved reporting facts. No contact names, emails, phone numbers, record IDs, or raw messages are included.

Production qualification, revenue attribution, CPL, CPA, ROI, and scorecards remain blocked until the qualification definition, campaign IDs, spend sources, association rules, deduplication, exclusions, and revenue definition are approved.

## Verification commands

```powershell
npm test
.\agent\Invoke-JasonHubSpotAgent.ps1 check-token
.\agent\Invoke-JasonHubSpotAgent.ps1 verify-ready
.\agent\Invoke-JasonHubSpotAgent.ps1 snapshot
.\agent\Invoke-JasonHubSpotAgent.ps1 schema-audit
.\agent\Invoke-JasonHubSpotAgent.ps1 attribution-audit
```
