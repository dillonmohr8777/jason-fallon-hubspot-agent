import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPECTED_PORTAL_ID,
  HubSpotClient,
  classifyContact,
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
  assert.equal(result.readyForReadReporting, false);
  assert.deepEqual(result.requiredFailures.map((item) => item.name), ["forms"]);
  assert.equal(result.readyForWrites, false);
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
