import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Local-only commands that intentionally stay out of the cloud workflow:
// context prints local handoff state, check-token inspects the local DPAPI
// token. Every other agent command must be runnable from GitHub Actions,
// or the other-computer and cloud paths silently lose features the local
// CLI has (this is exactly how lead-source-audit shipped unwired).
const LOCAL_ONLY = new Set(["context", "check-token"]);

test("live audit workflow exposes every cloud-safe agent command", () => {
  const agent = readFileSync(join(root, "agent", "jason-hubspot-agent.mjs"), "utf8");
  const commands = [...agent.matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]);
  assert.ok(commands.length > 0, "no commands parsed from agent switch");

  const workflow = readFileSync(
    join(root, ".github", "workflows", "jason-hubspot-live-audit.yml"),
    "utf8",
  );
  for (const command of commands) {
    if (LOCAL_ONLY.has(command)) continue;
    assert.match(
      workflow,
      new RegExp(`^\\s+-\\s+${command}\\r?$`, "m"),
      `workflow_dispatch options are missing "${command}"`,
    );
    assert.match(
      workflow,
      new RegExp(`jason-hubspot-agent\\.mjs ${command}\\b`),
      `workflow never runs "${command}"`,
    );
  }
});
