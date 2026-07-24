# Slack research: Jason Fallon / Momentum 360 HubSpot

Research date: 2026-07-23

Workspace: Momentum 360 Slack

This file summarizes operational requirements without copying contact-level lead PII.

## Immediate operating agenda

On 2026-07-22, Jason set the sequence:

1. Fix and QA the chatbot.
2. Configure CallRail after-hours and SMS behavior.
3. Build the internal agent for workflows and related setup.

Source: Jason, Sean, and Dillon group DM, message context around `1784739368.864439`.

## Decisions requested on 2026-07-23

Jason's HubSpot planning message asked for:

- a login session to inspect current HubSpot permissions and Customer Agent behavior
- current Customer Agent credit balance, pricing, agent status, and the reason conversations fall back to the human inbox
- an exact definition of a qualified lead
- separate mapping for Google Suspensions Campaign #1 and Campaign #2
- the source of monthly spend for Website, YouTube, Facebook/Instagram, META Suspensions, META AEO/VSL, both Google campaigns, Cold Email, and CallRail
- sales-rep/team ownership for each lead type
- the rule for restoring the original salesperson after a suspension case is reinstated
- a review of normalized source/qualification fields, backfill, dashboards, and Customer Agent permissions before live changes

Source: group DM `C0B2N20A0SW`, message `1784818535.386149`.

## Ownership and follow-up rules

Slack establishes HubSpot as the lead-assignment source of truth:

- Reps should not call directly from a Slack lead notification without checking HubSpot ownership.
- Reps should add notes, tasks, and disposition/qualification in HubSpot.
- Duplicate outreach must be prevented.
- A proposed suspension flow preserves the originating salesperson, temporarily assigns the Google Reinstatement team, notifies the correct people, creates follow-up when reinstatement is verified, then restores the originating salesperson.

Sources:

- `#360boilerroom`, message `1782483845.593949`
- `#gmbs-reinstatement`, messages `1782313646.485559` and `1782313696.500039`
- group DM `C0B2N20A0SW`, planning message `1784575968.445099`

The proposed ownership flow remains a design. Exact property names, temporary owner/team, notification recipients, and transition triggers are unresolved. No workflow should be enabled until those decisions are approved.

## CallRail, after-hours, and SMS

Slack asks include:

- CallRail-to-HubSpot synchronization
- after-hours coverage roughly in the 10 PM to 6 AM Eastern window
- an AI-assisted SMS response
- human business-hours follow-up
- consent-safe STOP language
- booking and routing into HubSpot

Source: `#360marketing`, thread rooted at message `1784559234.681189`, and Jason/Dillon DM context from 2026-07-09.

Do not assume the current token can configure CallRail, SMS, Conversations, or Workflows. Verify each external integration, consent rule, source field, and scope first.

## Chatbot and Customer Agent

Slack and existing configuration require:

- public identity: Momentum 360 Assistant
- service coverage: virtual tours, photography, video, SEO, AI search, ads, websites, lead generation, and reporting
- route captured lead details to HubSpot and notify the appropriate team
- send visitors to the approved contact/consultation path when useful
- no invented pricing, timing, capacity, appointment availability, guarantees, or claimed human notification
- clear escalation to a human for uncertain or account-specific answers

Recent Slack reported the bot could fail to respond and could fall back to the human inbox. Credit balance, pricing, assignment, knowledge sources, and fallback cause require live UI inspection in portal `50612503`.

## Case-study assets

Jason shared ten case-study graphics on 2026-07-20 covering:

- SEO/AEO
- Local Services Ads
- local map-pack SEO
- social media
- Google Ads

These are proof assets, not universal-result guarantees. See `ASSET_INDEX.md`.

## Slack research boundaries

- Slack is evidence for intent and operations, not automatic authorization for HubSpot writes.
- Contact notifications can contain PII. This repository stores only aggregate requirements and links/IDs for approved source assets.
- Do not reproduce passwords or one-time codes from Slack. Authentication and MFA remain human-only gates.
