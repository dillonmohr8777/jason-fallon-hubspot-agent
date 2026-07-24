import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const EXPECTED_PORTAL_ID = "50612503";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(here);
const outputRoot = path.join(repoRoot, "outputs");
const knowledgeRoot = path.join(repoRoot, "knowledge");

const REQUIRED_PROBES = [
  ["contacts", "/crm/v3/objects/contacts?limit=1&archived=false"],
  ["companies", "/crm/v3/objects/companies?limit=1&archived=false"],
  ["deals", "/crm/v3/objects/deals?limit=1&archived=false"],
  ["owners", "/crm/v3/owners?limit=100&archived=false"],
  ["dealPipelines", "/crm/v3/pipelines/deals"],
  ["forms", "/marketing/v3/forms/?limit=1"],
  ["calls", "/crm/v3/objects/calls?limit=1&archived=false"],
  ["meetings", "/crm/v3/objects/meetings?limit=1&archived=false"],
  ["tasks", "/crm/v3/objects/tasks?limit=1&archived=false"],
  ["contactSchema", "/crm/v3/properties/contacts"],
  ["companySchema", "/crm/v3/properties/companies"],
  ["dealSchema", "/crm/v3/properties/deals"],
];

const OPTIONAL_PROBES = [
  ["leads", "/crm/v3/objects/leads?limit=1&archived=false"],
  ["callSchema", "/crm/v3/properties/calls"],
  ["meetingSchema", "/crm/v3/properties/meetings"],
  ["conversations", "/conversations/v3/conversations/threads?limit=1"],
  ["workflows", "/automation/v3/workflows?limit=1"],
];

const CONTACT_PROPERTY_CANDIDATES = [
  "createdate",
  "hubspot_owner_id",
  "lifecyclestage",
  "hs_lead_status",
  "hs_analytics_source",
  "hs_analytics_source_data_1",
  "hs_analytics_source_data_2",
  "hs_latest_source",
  "hs_latest_source_data_1",
  "hs_latest_source_data_2",
  "hs_analytics_first_touch_converting_campaign",
  "hs_analytics_last_touch_converting_campaign",
  "hs_google_click_id",
  "hs_facebook_click_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "lead_source_primary",
  "lead_source_detail",
  "lead_channel",
  "campaign_name",
  "campaign_type",
  "first_touch_source",
  "latest_touch_source",
  "callrail_source",
  "callrail_lead_score",
  "source",
  "lead_source",
  "first_source_contacted",
  "first_medium_contacted",
  "first_campaign_contacted",
  "first_tracking_number_contacted",
  "last_source_contacted",
  "last_medium_contacted",
  "last_campaign_contacted",
  "last_tracking_number_contacted",
  "qualified_date",
  "hs_latest_qualified_lead_date",
  "hs_latest_disqualified_lead_date",
  "meeting_booked_date",
  "engagements_last_meeting_booked",
  "engagements_last_meeting_booked_source",
  "engagements_last_meeting_booked_medium",
  "engagements_last_meeting_booked_campaign",
  "opportunity_created_date",
];

const DEAL_PROPERTY_CANDIDATES = [
  "amount",
  "dealstage",
  "pipeline",
  "createdate",
  "closedate",
  "hubspot_owner_id",
  "hs_is_closed_won",
  "hs_closed_won_date",
  "hs_time_to_close",
  "lead_channel",
  "campaign_name",
  "hs_analytics_source",
];

const NORMALIZED_CHANNELS = [
  "Website",
  "YouTube",
  "Social Media (Facebook & Instagram)",
  "META Suspensions",
  "META AEO (VSL)",
  "Google Ads Campaign #1 (Suspensions)",
  "Google Ads Campaign #2 (Suspensions)",
  "Cold Email",
  "Phone Calls (CallRail)",
  "Needs Review",
];

function timestamp() {
  return new Date().toISOString();
}

function stampForFile() {
  return timestamp().replaceAll(":", "-").replaceAll(".", "-");
}

function safeErrorMessage(error) {
  return String(error?.message ?? error)
    .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .replace(/(hapikey|access_token|private_app_token)=([^&\s]+)/gi, "$1=[REDACTED]")
    .slice(0, 1000);
}

function roundWhole(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      options[key] = next;
      index += 1;
    } else {
      options[key] = true;
    }
  }
  return options;
}

export class HubSpotClient {
  constructor({
    token = process.env.JASON_HUBSPOT_PRIVATE_APP_TOKEN
      || process.env.JASON_HUBSPOT_SERVICE_KEY
      || process.env.JASON_HUBSPOT_ACCESS_TOKEN,
    fetchImpl = globalThis.fetch,
    baseUrl = "https://api.hubapi.com",
  } = {}) {
    this.token = token;
    this.fetchImpl = fetchImpl;
    this.baseUrl = baseUrl;
  }

  assertToken() {
    if (!this.token) {
      throw new Error("Missing Jason-specific HubSpot credential. Use agent/Set-JasonHubSpotToken.ps1.");
    }
  }

  async request(endpoint, { method = "GET", body, retries = 3 } = {}) {
    this.assertToken();
    if (!["GET", "POST"].includes(method)) {
      throw new Error(`Unsupported method ${method}; this agent is read-only.`);
    }
    if (method === "POST" && !endpoint.endsWith("/search")) {
      throw new Error(`POST is allowed only for HubSpot read-only search endpoints: ${endpoint}`);
    }

    const url = new URL(endpoint, this.baseUrl);
    let attempt = 0;
    while (true) {
      const response = await this.fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = { message: text.slice(0, 500) };
      }

      if (response.ok) return parsed;

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < retries) {
        const retryAfter = Number(response.headers?.get?.("retry-after"));
        const waitMs = Number.isFinite(retryAfter)
          ? Math.min(retryAfter * 1000, 30_000)
          : Math.min(500 * (2 ** attempt), 5_000);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        attempt += 1;
        continue;
      }

      const message = parsed?.message || response.statusText || "HubSpot request failed";
      const category = parsed?.category ? ` ${parsed.category}` : "";
      throw new Error(`HubSpot ${response.status}${category}: ${message}`);
    }
  }

  async validatePortal() {
    const data = await this.request("/integrations/v1/me");
    const portalId = String(data?.portalId ?? data?.hubId ?? "");
    if (portalId !== EXPECTED_PORTAL_ID) {
      throw new Error(
        `Portal guard failed: expected ${EXPECTED_PORTAL_ID}, received ${portalId || "unknown"}. `
        + "The credential is not authorized for Jason/Momentum 360.",
      );
    }
    return {
      valid: true,
      account: "Jason Fallon / Momentum 360",
      portalId,
      appId: data?.appId ?? null,
      userId: data?.userId ?? null,
      scopes: Array.isArray(data?.scopes) ? data.scopes : [],
      credentialSource: process.env.JASON_HUBSPOT_CREDENTIAL_SOURCE || "Jason-specific environment",
      verifiedAt: timestamp(),
    };
  }

  async probe(name, endpoint, required) {
    const startedAt = Date.now();
    try {
      const data = await this.request(endpoint, { retries: 1 });
      return {
        name,
        required,
        ok: true,
        latencyMs: Date.now() - startedAt,
        visibleCount: Array.isArray(data?.results) ? data.results.length : null,
      };
    } catch (error) {
      return {
        name,
        required,
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: safeErrorMessage(error),
      };
    }
  }

  async listAll(objectType, properties, onPage) {
    let after = null;
    let total = 0;
    do {
      const query = new URLSearchParams({ limit: "100", archived: "false" });
      if (properties?.length) query.set("properties", properties.join(","));
      if (after) query.set("after", String(after));
      const page = await this.request(`/crm/v3/objects/${objectType}?${query}`);
      const results = page?.results ?? [];
      total += results.length;
      await onPage(results);
      after = page?.paging?.next?.after ?? null;
    } while (after);
    return total;
  }

  async searchTotal(objectType) {
    const data = await this.request(`/crm/v3/objects/${objectType}/search`, {
      method: "POST",
      body: { filterGroups: [], sorts: [], properties: [], limit: 1, after: 0 },
    });
    return roundWhole(data?.total);
  }

  async properties(objectType) {
    const data = await this.request(`/crm/v3/properties/${objectType}`);
    return data?.results ?? [];
  }
}

export async function verifyReady(client) {
  const identity = await client.validatePortal();
  const runtime = {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
  };
  const probes = [];
  for (const [name, endpoint] of REQUIRED_PROBES) {
    probes.push(await client.probe(name, endpoint, true));
  }
  for (const [name, endpoint] of OPTIONAL_PROBES) {
    probes.push(await client.probe(name, endpoint, false));
  }
  const requiredFailures = probes.filter((probe) => probe.required && !probe.ok);
  const optionalFailures = probes.filter((probe) => !probe.required && !probe.ok);
  return {
    generatedAt: timestamp(),
    mode: "read-only",
    identity,
    runtime,
    readyForReadReporting: requiredFailures.length === 0,
    readyForWrites: false,
    requiredFailures,
    optionalFailures,
    probes,
    boundaries: [
      "No CRM, schema, workflow, form, dashboard, customer-agent, email, SMS, or ownership writes are implemented.",
      "Optional scope failures remain visible and are not bypassed.",
      "HubSpot native connector portal 242825734 is not an approved access path for this agent.",
    ],
  };
}

export async function buildSnapshot(client) {
  const identity = await client.validatePortal();
  const objectTypes = ["contacts", "companies", "deals", "calls", "meetings", "tasks"];
  const totals = {};
  for (const objectType of objectTypes) {
    try {
      totals[objectType] = await client.searchTotal(objectType);
    } catch (error) {
      totals[objectType] = { unavailable: true, error: safeErrorMessage(error) };
    }
  }

  const [owners, pipelines, forms] = await Promise.all([
    client.request("/crm/v3/owners?limit=100&archived=false"),
    client.request("/crm/v3/pipelines/deals"),
    client.request("/marketing/v3/forms/?limit=100"),
  ]);

  return {
    generatedAt: timestamp(),
    mode: "read-only aggregate",
    piiIncluded: false,
    identity,
    totals,
    owners: roundWhole(owners?.results?.length ?? 0),
    forms: roundWhole(forms?.results?.length ?? 0),
    dealPipelines: (pipelines?.results ?? []).map((pipeline) => ({
      id: String(pipeline.id),
      label: pipeline.label,
      stageCount: roundWhole(pipeline.stages?.length ?? 0),
    })),
    warnings: [
      "Counts describe current HubSpot objects, not verified leads or conversions.",
      "Qualification, deduplication, spam exclusion, and campaign mapping require approved definitions.",
    ],
  };
}

function propertySummary(allProperties, candidates) {
  const byName = new Map(allProperties.map((property) => [property.name, property]));
  return {
    totalProperties: roundWhole(allProperties.length),
    availableCandidates: candidates.filter((name) => byName.has(name)),
    missingCandidates: candidates.filter((name) => !byName.has(name)),
    candidateMetadata: candidates
      .filter((name) => byName.has(name))
      .map((name) => {
        const property = byName.get(name);
        return {
          name,
          label: property.label,
          type: property.type,
          fieldType: property.fieldType,
          readOnlyValue: Boolean(property.modificationMetadata?.readOnlyValue),
        };
      }),
  };
}

function relevantPropertyMetadata(allProperties) {
  const pattern = /source|campaign|utm|callrail|tracking|medium|gclid|fbclid|google|facebook|instagram|meta|youtube|qualified|meeting|opportunity|revenue|sales.?rep/i;
  return allProperties
    .filter((property) => pattern.test(`${property.name} ${property.label}`))
    .map((property) => ({
      name: property.name,
      label: property.label,
      type: property.type,
      fieldType: property.fieldType,
      hidden: Boolean(property.hidden),
      readOnlyValue: Boolean(property.modificationMetadata?.readOnlyValue),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function schemaAudit(client) {
  const identity = await client.validatePortal();
  const [contactProperties, dealProperties, companyProperties, callProperties, meetingProperties] =
    await Promise.all([
      client.properties("contacts"),
      client.properties("deals"),
      client.properties("companies"),
      client.properties("calls").catch(() => []),
      client.properties("meetings").catch(() => []),
    ]);

  const contact = propertySummary(contactProperties, CONTACT_PROPERTY_CANDIDATES);
  const deal = propertySummary(dealProperties, DEAL_PROPERTY_CANDIDATES);

  return {
    generatedAt: timestamp(),
    mode: "read-only schema audit",
    identity,
    propertyCounts: {
      contacts: roundWhole(contactProperties.length),
      deals: roundWhole(dealProperties.length),
      companies: roundWhole(companyProperties.length),
      calls: roundWhole(callProperties.length),
      meetings: roundWhole(meetingProperties.length),
    },
    contacts: contact,
    deals: deal,
    discoveredAttributionProperties: {
      contacts: relevantPropertyMetadata(contactProperties),
      deals: relevantPropertyMetadata(dealProperties),
      calls: relevantPropertyMetadata(callProperties),
      meetings: relevantPropertyMetadata(meetingProperties),
    },
    normalizedChannelTarget: NORMALIZED_CHANNELS,
    blockers: [
      "The exact qualified-lead definition is not approved.",
      "Google Suspensions Campaign #1 and #2 need stable campaign identifiers.",
      "Monthly spend sources are not approved for every channel.",
      "A normalized channel property must be validated before any schema proposal or backfill.",
      "No schema writes are authorized by this audit.",
    ],
  };
}

function lowerValues(properties) {
  return Object.values(properties ?? {})
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).toLowerCase())
    .join(" | ");
}

export function classifyContact(properties) {
  const text = lowerValues(properties);
  const hasCallRailSignal = [
    "callrail_source",
    "callrail_lead_score",
    "first_tracking_number_contacted",
    "last_tracking_number_contacted",
  ].some((name) => {
    const value = properties?.[name];
    return value !== null && value !== undefined && String(value).trim() !== "";
  });
  if (hasCallRailSignal || /callrail|tracking.number|phone.call/.test(text)) {
    return "Phone Calls (CallRail)";
  }
  if (/(meta|facebook|instagram).*(aeo|vsl)|(aeo|vsl).*(meta|facebook|instagram)/.test(text)) {
    return "META AEO (VSL)";
  }
  if (/(meta|facebook|instagram).*(suspension|reinstatement)|(suspension|reinstatement).*(meta|facebook|instagram)/.test(text)) {
    return "META Suspensions";
  }
  if (/(google|adwords|paid.search|cpc).*(campaign.?2|suspension.?2)|campaign.?2.*(google|adwords)/.test(text)) {
    return "Google Ads Campaign #2 (Suspensions)";
  }
  if (/(google|adwords|paid.search|cpc).*(suspension|reinstatement)|(suspension|reinstatement).*(google|adwords|paid.search|cpc)/.test(text)) {
    return "Google Ads Campaign #1 (Suspensions)";
  }
  if (/youtube|youtu\.be/.test(text)) return "YouTube";
  if (/cold.email|outbound.email|cold outreach/.test(text)) return "Cold Email";
  if (/facebook|instagram|social.media|organic.social|paid.social/.test(text)) {
    return "Social Media (Facebook & Instagram)";
  }
  if (/organic.search|direct.traffic|referral|website|web.form|offline.sources/.test(text)) {
    return "Website";
  }
  return "Needs Review";
}

function increment(record, key, amount = 1) {
  record[key] = roundWhole((record[key] ?? 0) + amount);
}

function distributionFromRecord(record) {
  return Object.fromEntries(
    Object.entries(record)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key || "(blank)", roundWhole(value)]),
  );
}

export async function attributionAudit(client) {
  const identity = await client.validatePortal();
  const contactSchema = await client.properties("contacts");
  const contactNames = new Set(contactSchema.map((property) => property.name));
  const requested = CONTACT_PROPERTY_CANDIDATES.filter((name) => contactNames.has(name));

  const channelCounts = Object.fromEntries(NORMALIZED_CHANNELS.map((channel) => [channel, 0]));
  const lifecycleStages = {};
  const leadStatuses = {};
  const ownerCounts = {};

  const contactsAudited = await client.listAll("contacts", requested, async (contacts) => {
    for (const contact of contacts) {
      const properties = contact.properties ?? {};
      increment(channelCounts, classifyContact(properties));
      increment(lifecycleStages, properties.lifecyclestage || "(blank)");
      increment(leadStatuses, properties.hs_lead_status || "(blank)");
      increment(ownerCounts, properties.hubspot_owner_id || "(unassigned)");
    }
  });

  const mapped = contactsAudited - channelCounts["Needs Review"];
  const coveragePercent = contactsAudited
    ? Math.round((mapped / contactsAudited) * 10_000) / 100
    : 0;

  const snapshot = await buildSnapshot(client);
  return {
    generatedAt: timestamp(),
    mode: "read-only aggregate attribution audit",
    piiIncluded: false,
    identity,
    contactsAudited: roundWhole(contactsAudited),
    provisionalChannelMapping: Object.fromEntries(
      NORMALIZED_CHANNELS.map((channel) => [channel, roundWhole(channelCounts[channel])]),
    ),
    propertiesUsed: requested,
    provisionalMappingCoveragePercent: coveragePercent,
    lifecycleStageDistribution: distributionFromRecord(lifecycleStages),
    leadStatusDistribution: distributionFromRecord(leadStatuses),
    ownerAssignmentDistribution: distributionFromRecord(ownerCounts),
    objectTotals: snapshot.totals,
    qualification: {
      status: "blocked-pending-business-definition",
      reason: "Slack explicitly requested a decision on what counts as qualified. No definition is assumed.",
    },
    revenueAttribution: {
      status: "blocked-pending-association-and-reconciliation-rules",
      reason: "Deal revenue is not assigned to a channel until contact/deal association, campaign mapping, dedupe, and exclusion rules are approved.",
    },
    spendAndRoi: {
      status: "blocked-pending-source-of-truth",
      reason: "Monthly spend sources for each channel/campaign have not been approved.",
    },
    limitations: [
      "Channel counts are deterministic candidates for review, not approved reporting facts.",
      "Needs Review remains explicit; ambiguous records are not forced into a channel.",
      "No contact names, emails, phone numbers, record IDs, messages, or raw properties are written.",
      "Platform conversions remain distinct from verified leads and qualified business outcomes.",
    ],
  };
}

async function contextManifest({ full = false } = {}) {
  const names = (await fs.readdir(knowledgeRoot))
    .filter((name) => name.endsWith(".md"))
    .sort();
  const files = [];
  for (const name of names) {
    const text = await fs.readFile(path.join(knowledgeRoot, name), "utf8");
    files.push({
      path: `knowledge/${name}`,
      bytes: Buffer.byteLength(text),
      ...(full ? { content: text } : {}),
    });
  }
  return {
    account: "Jason Fallon / Momentum 360",
    portalId: EXPECTED_PORTAL_ID,
    mode: "read-only by default",
    knowledgeFiles: files,
  };
}

async function writeOutput(kind, payload) {
  const directory = path.join(outputRoot, kind);
  await fs.mkdir(directory, { recursive: true });
  const outputPath = path.join(directory, `${stampForFile()}.json`);
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return outputPath;
}

async function main() {
  const command = process.argv[2] || "verify-ready";
  const options = parseArgs(process.argv.slice(3));
  const client = new HubSpotClient();
  let result;
  let outputPath = null;

  switch (command) {
    case "context":
      result = await contextManifest({ full: Boolean(options.full) });
      break;
    case "check-token":
      result = await client.validatePortal();
      break;
    case "verify-ready":
      result = await verifyReady(client);
      outputPath = await writeOutput("readiness", result);
      break;
    case "snapshot":
      result = await buildSnapshot(client);
      outputPath = await writeOutput("snapshots", result);
      break;
    case "schema-audit":
      result = await schemaAudit(client);
      outputPath = await writeOutput("schema-audits", result);
      break;
    case "attribution-audit":
      result = await attributionAudit(client);
      outputPath = await writeOutput("attribution-audits", result);
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  console.log(JSON.stringify({ ...result, ...(outputPath ? { outputPath } : {}) }, null, 2));
}

const isEntrypoint = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntrypoint) {
  main().catch((error) => {
    console.error(safeErrorMessage(error));
    process.exitCode = 1;
  });
}
