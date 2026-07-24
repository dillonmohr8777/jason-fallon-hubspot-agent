# Momentum 360 reporting and attribution requirements

Sources:

- Slack file `REPORTING AND TRACKING.docx`, file ID `F0B8LSLA4DC`, created 2026-06-05
- Slack PDF `Momentum 360 Account Manager Reporting OS - Master Multi-Agent Prompt`, file ID `F0BJVGFU5H9`, 13 pages, created 2026-07-22
- Slack PDF `Momentum 360 AM Dashboard - Shorter Build Prompt`, file ID `F0BKJK2CA3E`, 2 pages, created 2026-07-23

## Required marketing channels

Track separately:

1. Website
2. YouTube
3. Social Media (Facebook and Instagram)
4. META Suspensions
5. META AEO (VSL)
6. Google Ads Campaign #1 (Suspensions)
7. Google Ads Campaign #2 (Suspensions)
8. Cold Email
9. Phone Calls (CallRail)

Do not merge the two Google campaigns or the two META programs.

## Per-channel metrics

- Total leads
- Qualified leads
- Closed deals
- Revenue generated
- Average deal size
- Cost per lead
- Cost per acquisition
- Return on investment
- Lead-to-close conversion rate

Each metric needs a documented source, reporting window, timezone, extraction time, freshness state, definition, exclusions, and reconciliation status.

## Sales-team metrics

- Leads assigned per rep
- Lead response time
- Meetings booked
- Opportunities created
- Close rate
- Revenue generated
- Average deal size
- Sales cycle length
- Customer lifetime value
- Performance ranking and scorecard

Do not generate rankings until ownership history, response-time events, transfers, qualification, and revenue association are reliable.

## Data correctness rules

- Use the same declared reporting window and client timezone across every source.
- Treat date-only values as calendar dates, not UTC timestamps.
- Display counts as whole integers.
- Missing values are unavailable or pending, not zero.
- A missing denominator yields unavailable, not zero or infinity.
- Keep Google Ads conversions, Meta leads, forms, calls, booked appointments, qualified opportunities, and revenue outcomes distinct.
- Exclude tests, routing tests, duplicates, spam, and unverified rows by inspectable rules.
- Retain source, extraction time, source-update time, freshness, authorization, and reconciliation state.
- Platform conversions are not automatically verified leads.
- Overrides need actor, time, reason, and prior value.

## Current unresolved definitions

These block production dashboards:

- exact qualified-lead definition
- exact campaign IDs/names for Google Suspensions #1 and #2
- exact campaign IDs/names for META Suspensions and META AEO/VSL
- source of truth for website and form attribution
- monthly spend source for all nine channels
- CallRail field and call-disposition mapping
- contact/deal association and deduplication
- spam, test, foreign-language, and invalid-number policies
- closed-won/revenue recognition rule
- customer lifetime value source
- historical owner/transfer logic

## Account Manager Reporting OS requirements

The longer PDF defines a secure, multi-client reporting operating system with:

- authenticated, assignment-scoped users
- exact client, period, and timezone
- source health and freshness
- normalized source adapters
- canonical report snapshots
- reconciliation and exclusions
- review documents, comments, approvals, publishing, and delivery as separate states
- audit logging, tenant isolation, secret handling, and rollback

Its current-state warning is important: the public Netlify dashboard had unauthenticated client metrics and mutation risks, unclear client scoping, source staleness, date parsing defects, and mismatched local/live API routes. Those dashboard defects are not repaired by this HubSpot repository.

## Shorter dashboard prompt boundary

The two-page prompt describes a single-client review dashboard with:

- monthly KPI report
- month selector
- live/pending source status
- review state, Google Doc link, comments, Approve, and Request Edits
- one authorized reviewer
- Supabase auth/data and Vercel deployment

It is a build prompt, not evidence that those systems are deployed or secure. Never return reviewer credentials in a repository or chat. Never deploy or publish client data without explicit approval.

## Recommended sequence

1. Run portal and readiness checks.
2. Run schema audit.
3. Approve business definitions.
4. Approve stable campaign and spend-source mappings.
5. Produce a dated aggregate attribution audit.
6. Reconcile HubSpot against CallRail and ad-source evidence.
7. Only then propose properties, backfill, dashboards, workflows, or scorecards.
