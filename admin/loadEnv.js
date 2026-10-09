import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Loads admin/.env (KEY=VALUE per line, # comments, optional quotes) into
// process.env before anything else in this package reads its config. Real
// environment variables you've already exported always win — this only fills
// in values that aren't set yet, so it's a convenience default, not an
// override. Import this file FIRST in any entry point that needs it (import
// order determines evaluation order, and other modules read process.env at
// their own top level).
//
// .env is gitignored at the repo root; copy .env.example to .env and fill it
// in rather than committing real secrets here.

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), ".env");

try {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
} catch (err) {
  if (err.code !== "ENOENT") {
    console.error(`[opskeep-admin] could not read .env: ${err.message}`);
  }
}
