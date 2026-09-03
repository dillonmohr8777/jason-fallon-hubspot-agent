import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPECTED_PORTAL_ID,
  HubSpotClient,
  buildWindowReport,
  callRailWindowFilterGroups,
  classifyContact,
  computeReadinessStatus,
  coveragePercent,
  createdateWindowFilters,
  dailyHealth,
  defaultReportingWindow,
  distributionOf,
  easternDay,
  leadSourceAudit,
  statusReasons,
  summarizeForms,
  verifyReady,
} from "../agent/jason-hubspot-agent.mjs";

function response(body, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    text: async () => JSON.stringify(body),
  };
}

test("validates the Jason portal", async () => {
  const client = new HubSpotClient({
    token: "test-token",
    fetchImpl: async () => response({ portalId: Number(EXPECTED_PORTAL_ID) }),
  });
  const identity = await client.validatePortal();
  assert.equal(identity.portalId, EXPECTED_PORTAL_ID);
  assert.equal(identity.account, "Jason Fallon / Momentum 360");
});

test("fails closed on Align HCM portal", async () => {
  const client = new HubSpotClient({
    token: "test-token",
    fetchImpl: async () => response({ portalId: 242825734 }),
  });
  await assert.rejects(() => client.validatePortal(), /Portal guard failed/);
});

test("ignores generic HubSpot environment variables", () => {
  const priorGeneric = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  const priorJason = process.env.JASON_HUBSPOT_PRIVATE_APP_TOKEN;
  process.env.HUBSPOT_PRIVATE_APP_TOKEN = "wrong-account-token";
  delete process.env.JASON_HUBSPOT_PRIVATE_APP_TOKEN;
  try {
    const client = new HubSpotClient();
    assert.equal(client.token, undefined);
    assert.throws(() => client.assertToken(), /Missing Jason-specific/);
  } finally {
    if (priorGeneric === undefined) delete process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    else process.env.HUBSPOT_PRIVATE_APP_TOKEN = priorGeneric;
    if (priorJason === undefined) delete process.env.JASON_HUBSPOT_PRIVATE_APP_TOKEN;
    else process.env.JASON_HUBSPOT_PRIVATE_APP_TOKEN = priorJason;
  }
});

test("searchTotal sends date-window filters on the read-only search POST", async () => {
  let captured = null;
  const client = new HubSpotClient({
    token: "test-token",
    fetchImpl: async (url, init) => {
      captured = { url: String(url), ...init };
      return response({ total: 16 });
    },
  });
  const startMs = Date.parse("2026-08-27T13:00:07.000Z");
  const endMs = Date.parse("2026-08-28T13:00:07.000Z");
  const total = await client.searchTotal("contacts", {
    filters: createdateWindowFilters(startMs, endMs),
  });
  assert.equal(total, 16);
  assert.match(captured.url, /\/crm\/v3\/objects\/contacts\/search$/);
  assert.equal(captured.method, "POST");
  assert.deepEqual(JSON.parse(captured.body).filterGroups, [{
    filters: createdateWindowFilters(startMs, endMs),
  }]);
});

test("allows POST only for read-only search endpoints", async () => {
  const client = new HubSpotClient({
    token: "test-token",
    fetchImpl: async () => response({}),
  });
  await assert.rejects(
    () => client.request("/crm/v3/objects/contacts", { method: "POST", body: {} }),
    /POST is allowed only/,
  );
});

test("readiness fails when a required probe fails", async () => {
  const client = {
    validatePortal: async () => ({ portalId: EXPECTED_PORTAL_ID }),
    probe: async (name, _endpoint, required) => ({
      name,
      required,
      ok: !(required && name === "forms"),
    }),
  };
  const result = await verifyReady(client);
  assert.equal(result.status, "unavailable");
  assert.equal(result.readyForReadReporting, false);
  assert.deepEqual(result.requiredFailures.map((item) => item.name), ["forms"]);
  assert.deepEqual(result.statusReasons, ["forms: required probe failed"]);
  assert.equal(result.readyForWrites, false);
});

test("readiness is degraded when only optional probes fail", async () => {
  const client = {
    validatePortal: async () => ({ portalId: EXPECTED_PORTAL_ID }),
    probe: async (name, _endpoint, required) => ({
      name,
      required,
      ok: !(name === "conversations"),
    }),
  };
  const result = await verifyReady(client);
  assert.equal(result.status, "degraded");
  assert.equal(result.readyForReadReporting, true);
  assert.deepEqual(result.requiredFailures, []);
  assert.deepEqual(result.optionalFailures.map((item) => item.name), ["conversations"]);
  assert.deepEqual(result.statusReasons, ["conversations: optional probe failed"]);
  assert.equal(result.readyForWrites, false);
});

test("readiness is ready when every probe passes", async () => {
  const client = {
    validatePortal: async () => ({ portalId: EXPECTED_PORTAL_ID }),
    probe: async (name, _endpoint, required) => ({
      name,
      required,
      ok: true,
    }),
  };
  const result = await verifyReady(client);
  assert.equal(result.status, "ready");
  assert.equal(result.readyForReadReporting, true);
  assert.deepEqual(result.statusReasons, []);
});

test("computeReadinessStatus keeps missing values out of the ready state", () => {
  assert.equal(computeReadinessStatus([], []), "ready");
  assert.equal(computeReadinessStatus([], [{ name: "conversations" }]), "degraded");
  assert.equal(computeReadinessStatus([{ name: "forms" }], [{ name: "conversations" }]), "unavailable");
  assert.deepEqual(
    statusReasons([{ name: "forms" }], [{ name: "conversations" }]),
    ["forms: required probe failed", "conversations: optional probe failed"],
  );
});

test("date-window helpers stay explicit and do not invent coverage", () => {
  const startMs = Date.parse("2026-08-27T13:00:07.000Z");
  const endMs = Date.parse("2026-08-28T13:00:07.000Z");
  assert.deepEqual(createdateWindowFilters(startMs, endMs), [
    { propertyName: "createdate", operator: "GTE", value: String(startMs) },
    { propertyName: "createdate", operator: "LT", value: String(endMs) },
  ]);
  const groups = callRailWindowFilterGroups(startMs, endMs, { requireOwner: true });
  assert.equal(groups.length, 3);
  assert.ok(groups.every((group) => group.filters.some((filter) => filter.propertyName === "hubspot_owner_id")));
  assert.deepEqual(coveragePercent(11, 0), 0);
  assert.deepEqual(coveragePercent(0, 0), { unavailable: true, reason: "denominator is zero" });
  assert.deepEqual(coveragePercent({ unavailable: true }, 0), { unavailable: true });
  const window = defaultReportingWindow(new Date("2026-08-28T13:00:07.000Z"));
  assert.equal(window.timezone, "America/New_York");
  assert.equal(window.endAt, "2026-08-28T13:00:07.000Z");
  assert.equal(window.startAt, "2026-08-27T13:00:07.000Z");
});

test("window report uses date filters and keeps failed totals unavailable", async () => {
  const startMs = Date.parse("2026-08-27T13:00:07.000Z");
  const endMs = Date.parse("2026-08-28T13:00:07.000Z");
  const calls = [];
  const client = {
    validatePortal: async () => ({ portalId: EXPECTED_PORTAL_ID }),
    searchTotal: async (objectType, options = {}) => {
      calls.push({ objectType, options });
      if (objectType === "meetings") throw new Error("HubSpot 403 MISSING_SCOPES: meetings");
      if (options.filterGroups) {
        const ownerRequired = options.filterGroups.some((group) => (
          group.filters.some((filter) => filter.propertyName === "hubspot_owner_id")
        ));
        return ownerRequired ? 0 : 11;
      }
      return objectType === "contacts" ? 16 : 1;
    },
  };
  const report = await buildWindowReport(client, { startMs, endMs });
  assert.equal(report.createdInWindow.contacts, 16);
  assert.deepEqual(report.createdInWindow.meetings, {
    unavailable: true,
    error: "HubSpot 403 MISSING_SCOPES: meetings",
  });
  assert.equal(report.callRail.ingestions, 11);
  assert.equal(report.callRail.ownerAssigned, 0);
  assert.equal(report.callRail.ownerCoveragePercent, 0);
  assert.equal(report.createdVersusUpdatedSplit.contactsCreated, 16);
  assert.ok(calls.some((call) => call.options.filters?.[0]?.propertyName === "createdate"));
  assert.ok(calls.some((call) => Array.isArray(call.options.filterGroups)));
});

test("daily health carries the degraded status and the date-window report", async () => {
  const client = {
    validatePortal: async () => ({ portalId: EXPECTED_PORTAL_ID }),
    probe: async (name, _endpoint, required) => ({
      name,
      required,
      ok: name !== "conversations",
    }),
    searchTotal: async () => 0,
  };
  const result = await dailyHealth(client, {
    startMs: Date.parse("2026-08-27T13:00:07.000Z"),
    endMs: Date.parse("2026-08-28T13:00:07.000Z"),
  });
  assert.equal(result.status, "degraded");
  assert.equal(result.readyForReadReporting, true);
  assert.equal(result.readyForWrites, false);
  assert.equal(result.portalId, EXPECTED_PORTAL_ID);
  assert.match(result.reportId, /^M360-DAILY-\d{4}-\d{2}-\d{2}$/);
  assert.equal(result.window.createdInWindow.contacts, 0);
  assert.equal(result.window.callRail.ownerCoveragePercent.unavailable, true);
});

test("normalizes known channel signals and preserves ambiguity", () => {
  assert.equal(
    classifyContact({ utm_source: "callrail", first_tracking_number: "2155550100" }),
    "Phone Calls (CallRail)",
  );
  assert.equal(
    classifyContact({ utm_source: "facebook", utm_campaign: "META AEO VSL" }),
    "META AEO (VSL)",
  );
  assert.equal(
    classifyContact({ utm_source: "google", utm_medium: "cpc", utm_campaign: "Suspension Campaign 2" }),
    "Google Ads Campaign #2 (Suspensions)",
  );
  assert.equal(classifyContact({ utm_source: "youtube" }), "YouTube");
  assert.equal(classifyContact({ hs_analytics_source: "ORGANIC_SEARCH" }), "Website");
  assert.equal(classifyContact({ createdate: "2026-07-23T00:00:00Z" }), "Needs Review");
});

test("distributionOf counts blanks explicitly and sorts by frequency", () => {
  const records = [
    { properties: { hs_object_source_label: "INTEGRATION" } },
    { properties: { hs_object_source_label: "INTEGRATION" } },
    { properties: { hs_object_source_label: "FORM" } },
    { properties: {} },
  ];
  const counts = distributionOf(records, (properties) => properties.hs_object_source_label);
  assert.deepEqual(Object.keys(counts), ["INTEGRATION", "FORM", "(blank)"]);
  assert.equal(counts.INTEGRATION, 2);
  assert.equal(counts["(blank)"], 1);
});

test("easternDay buckets by America/New_York calendar date, not UTC", () => {
  assert.equal(easternDay("2026-09-02T03:30:00.000Z"), "2026-09-01");
  assert.equal(easternDay("2026-09-02T04:30:00.000Z"), "2026-09-02");
  assert.equal(easternDay(null), "(blank)");
  assert.equal(easternDay("not-a-date"), "(blank)");
});

test("summarizeForms keeps only non-PII configuration metadata", () => {
  const summary = summarizeForms([
    { id: "2", name: "Beta", formType: "HUBSPOT", archived: false, extra: "drop-me" },
    { id: "1", name: "Alpha", formType: "FACEBOOK_LEAD_AD" },
  ]);
  assert.deepEqual(summary.map((form) => form.name), ["Alpha", "Beta"]);
  assert.deepEqual(Object.keys(summary[0]).sort(), [
    "archived", "createdAt", "formType", "id", "name", "updatedAt",
  ]);
});

test("lead source audit filters by createdate window and emits aggregates only", async () => {
  const calls = [];
  const client = new HubSpotClient({
    token: "test-token",
    fetchImpl: async (url, init) => {
      const href = String(url);
      calls.push(href);
      if (href.includes("/integrations/v1/me")) {
        return response({ portalId: Number(EXPECTED_PORTAL_ID) });
      }
      if (href.includes("/crm/v3/properties/contacts")) {
        return response({
          results: [
            { name: "createdate" },
            { name: "hs_object_source_label" },
            { name: "hs_analytics_source" },
          ],
        });
      }
      if (href.includes("/crm/v3/objects/contacts/search")) {
        const body = JSON.parse(init.body);
        assert.deepEqual(
          body.filterGroups[0].filters.map((filter) => filter.propertyName),
          ["createdate", "createdate"],
        );
        return response({
          results: [
            {
              id: "1",
              properties: {
                createdate: "2026-09-02T14:00:00.000Z",
                hs_object_source_label: "INTEGRATION",
                hs_analytics_source: "PAID_SOCIAL",
              },
            },
          ],
        });
      }
      if (href.includes("/marketing/v3/forms")) {
        return response({ results: [{ id: "9", name: "360 Contact", formType: "HUBSPOT" }] });
      }
      return response({ message: "not found" }, 404);
    },
  });

  const audit = await leadSourceAudit(client, {
    startMs: Date.parse("2026-08-31T04:00:00.000Z"),
    endMs: Date.parse("2026-09-02T20:00:00.000Z"),
  });

  assert.equal(audit.contactsCreatedInWindow, 1);
  assert.equal(audit.piiIncluded, false);
  assert.deepEqual(audit.missingProperties.includes("hs_latest_source"), true);
  assert.deepEqual(audit.distributions.byObjectSourceLabel, { INTEGRATION: 1 });
  assert.equal(audit.forms[0].name, "360 Contact");
  const serialized = JSON.stringify(audit);
  assert.equal(serialized.includes("\"id\":\"1\""), false);
  assert.equal(audit.ingestPathProbes.some((probe) => probe.ok === false), true);
});

test("distributionOf caps the long tail so record identifiers stay out of evidence", () => {
  const records = Array.from({ length: 50 }, (_, index) => ({
    properties: { hs_object_source_id: `guid-${index}` },
  }));
  const counts = distributionOf(records, (properties) => properties.hs_object_source_id, 5);
  assert.equal(Object.keys(counts).length, 6);
  assert.equal(counts["(other: 45 distinct values withheld)"], 45);
});
