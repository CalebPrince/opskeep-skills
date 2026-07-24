#!/usr/bin/env node
// Lists eval scenarios found under evals/. Scenario runners are added as the
// eval format solidifies — for now this just confirms coverage exists.
const fs = require("fs");
const path = require("path");

const evalsDir = path.join(__dirname, "..", "evals");

function walk(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (entry.name.endsWith(".md")) found.push(full);
  }
  return found;
}

const scenarios = walk(evalsDir);
if (scenarios.length === 0) {
  console.warn("No eval scenarios found under evals/.");
  process.exit(0);
}

console.log(`Found ${scenarios.length} eval scenario(s):`);
scenarios.forEach((file) => console.log(` - ${path.relative(evalsDir, file)}`));
