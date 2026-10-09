// File access for the admin dashboard. Reads and writes the same JSON store the
// opskeep-tools MCP server uses (~/.opskeep/registry.json by default, override
// with OPSKEEP_STORE_FILE), so the dashboard and the MCP tools are one source
// of truth.
//
// Unlike the MCP server (which caches collections in memory and writes through
// on every mutation), this module re-loads the file for each request. That
// keeps the dashboard's view of the data fresh even while the MCP server is
// running, and avoids holding a stale in-memory copy. Mutation still goes
// through a single load -> change -> save per request, so two dashboards or an
// MCP server mutating at the exact same moment can race; this is low-traffic
// admin bookkeeping, so that is an accepted scaffold trade-off.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const STORE_FILE =
  process.env.OPSKEEP_STORE_FILE || path.join(os.homedir(), ".opskeep", "registry.json");

const COLLECTIONS = [
  "clients",
  "clientKeys",
  "creditPurchases",
  "agentUsage",
  "agentRuns",
];

export function load() {
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`[opskeep-admin] could not read ${STORE_FILE}: ${err.message}`);
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) data = {};
  for (const name of COLLECTIONS) {
    if (!data[name] || typeof data[name] !== "object" || Array.isArray(data[name])) {
      data[name] = {};
    }
  }
  return data;
}

export function save(data) {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  const tmp = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, STORE_FILE);
}

// Ids look like "prefix_123". The next id must never collide with anything the
// MCP server already wrote to disk, even if it was edited by hand.
export function newId(data, prefix) {
  let max = 0;
  for (const name of COLLECTIONS) {
    for (const id of Object.keys(data[name] ?? {})) {
      const match = /_(\d+)$/.exec(id);
      if (match) max = Math.max(max, Number(match[1]));
    }
  }
  const next = Math.max(data.nextId ?? 1, max + 1);
  data.nextId = next + 1;
  return `${prefix}_${next}`;
}

export function findClient(data, ref) {
  for (const [id, c] of Object.entries(data.clients ?? {})) {
    if (id === ref || c.website === ref || c.name === ref) return [id, c];
  }
  return null;
}

export function balance(data, clientId) {
  const purchased = Object.values(data.creditPurchases ?? {})
    .filter((p) => p.clientId === clientId)
    .reduce((sum, p) => sum + (Number(p.credits) || 0), 0);
  const used = Object.values(data.agentUsage ?? {})
    .filter((u) => u.clientId === clientId)
    .reduce((sum, u) => sum + (Number(u.credits) || 0), 0);
  return { purchased, used, remaining: purchased - used };
}

export function maskKeyValue(value) {
  const v = String(value);
  if (v.length <= 8) return "••••";
  return `${v.slice(0, 4)}••••${v.slice(-4)}`;
}