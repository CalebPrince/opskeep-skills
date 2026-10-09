// File-backed storage for the opskeep-tools MCP server. Every collection
// survives server restarts, so multi-session use keeps its records.
//
// Data is written atomically (temp file + rename) to a single JSON file on
// every mutating call. Default location is ~/.opskeep/registry.json; override
// with the OPSKEEP_STORE_FILE environment variable (e.g. to point at a shared
// or project-local file). One server instance should own a given file.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const STORE_FILE =
  process.env.OPSKEEP_STORE_FILE || path.join(os.homedir(), ".opskeep", "registry.json");

const COLLECTIONS = [
  "reminders", // id -> { message, sendAt, timezone, recipientEmail, status }
  "recurringReminders", // id -> { message, recipientEmail, frequency, time, timezone, dayOfWeek, dayOfMonth, status }
  "timeEntries", // project -> [{ id, startedAt, stoppedAt, note }]
  "runningTimers", // project -> { id, startedAt, note }
  "expenses", // id -> { jobLabel, category, amount, currency, miles, description, date, status }
  "escalations", // id -> { summary, conversationRef, reason, ownerContact, status, ownerResponse, createdAt, resolvedAt }
  "clients", // id -> { name, website, notes, createdAt }
  "clientKeys", // id -> { clientId, provider, model, keyLabel, keyMask, status, addedAt }
  "creditPurchases", // id -> { clientId, amount, currency, credits, ref, date }
  "agentUsage", // id -> { clientId, action, credits, date, note }
  "agentRuns", // id -> { clientId, task, status, runner, credits, startedAt, finishedAt, note }
];

function load() {
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`[opskeep-tools] could not read ${STORE_FILE}; starting empty: ${err.message}`);
    }
    return {};
  }
}

const raw = load();

function makeMap(name) {
  return new Map(Object.entries(raw[name] ?? {}));
}

const maps = {};
for (const name of COLLECTIONS) {
  maps[name] = makeMap(name);
}

// ids look like "prefix_123"; the next id must never collide with what is
// already on disk, even if the file was edited by hand.
let maxNumericId = 0;
for (const name of COLLECTIONS) {
  for (const id of maps[name].keys()) {
    const match = /_(\d+)$/.exec(id);
    if (match) maxNumericId = Math.max(maxNumericId, Number(match[1]));
  }
}
const persistedNextId = Number.isFinite(raw.nextId) ? raw.nextId : 1;
let nextId = Math.max(persistedNextId, maxNumericId + 1);

export function newId(prefix) {
  return `${prefix}_${nextId++}`;
}

function serialize() {
  const data = { nextId };
  for (const name of COLLECTIONS) {
    data[name] = Object.fromEntries(maps[name]);
  }
  return data;
}

function persist() {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  const tmp = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(serialize(), null, 2));
  fs.renameSync(tmp, STORE_FILE);
}

// Wrap each Map so `set`, `delete`, and `clear` write through to disk. The
// collections below keep the plain Map interface, so callers unchanged.
function persistOnWrite(map) {
  return new Proxy(map, {
    get(target, prop) {
      const value = Reflect.get(target, prop);
      if (typeof value !== "function") return value;
      if (prop === "set" || prop === "delete" || prop === "clear") {
        return (...args) => {
          const result = value.apply(target, args);
          persist();
          return result;
        };
      }
      return value.bind(target);
    },
  });
}

export const reminders = persistOnWrite(maps.reminders);
export const recurringReminders = persistOnWrite(maps.recurringReminders);
export const timeEntries = persistOnWrite(maps.timeEntries);
export const runningTimers = persistOnWrite(maps.runningTimers);
export const expenses = persistOnWrite(maps.expenses);
export const escalations = persistOnWrite(maps.escalations);
export const clients = persistOnWrite(maps.clients);
export const clientKeys = persistOnWrite(maps.clientKeys);
export const creditPurchases = persistOnWrite(maps.creditPurchases);
export const agentUsage = persistOnWrite(maps.agentUsage);
export const agentRuns = persistOnWrite(maps.agentRuns);