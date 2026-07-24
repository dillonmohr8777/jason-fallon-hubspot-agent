# Jason Fallon / Momentum 360 HubSpot agent

This repository is exclusively for Jason Fallon and Momentum 360 HubSpot portal `50612503`.

## Hard account boundary

- Verify portal `50612503` before every live operation.
- Fail closed on any other portal.
- Never use the native Codex HubSpot connector while it identifies as Align HCM portal `242825734`.
- Never use generic `HUBSPOT_PRIVATE_APP_TOKEN`, `HUBSPOT_SERVICE_KEY`, or Align token variables here.
- Use only the Jason-specific launcher and protected Jason credential path.

## Operating boundary

- Default to read-only identity, readiness, schema, aggregate reporting, and attribution audits.
- Do not create or edit CRM records, schemas, properties, workflows, forms, dashboards, chatflows, customer-agent settings, permissions, emails, SMS, or ownership without Dillon's explicit approval for the exact change.
- Do not publish, send, or share client output without explicit approval.
- Do not include contact-level PII in committed artifacts. Aggregate counts and non-secret schema metadata only.
- Display lead and conversion-event counts as whole integers.
- Keep platform conversions distinct from verified leads, qualified leads, closed deals, and revenue.
- Missing, inaccessible, stale, or unverified values remain pending or unavailable, never zero.

## Commands

Run through `agent/Invoke-JasonHubSpotAgent.ps1`:

- `check-token`
- `verify-ready`
- `snapshot`
- `schema-audit`
- `attribution-audit`
- `context`

Before calling the agent ready, run `npm test` and `npm run verify`.
