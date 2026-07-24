#!/usr/bin/env node
// Validates that every skills/<name>/SKILL.md has the required frontmatter fields.
const fs = require("fs");
const path = require("path");

const skillsDir = path.join(__dirname, "..", "skills");
const required = ["name", "description", "lane"];
let hasError = false;

for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    console.error(`✗ ${entry.name}: missing SKILL.md`);
    hasError = true;
    continue;
  }

  const contents = fs.readFileSync(skillPath, "utf8");
  const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.error(`✗ ${entry.name}: SKILL.md has no frontmatter block`);
    hasError = true;
    continue;
  }

  const frontmatter = frontmatterMatch[1];
  const missing = required.filter((key) => !new RegExp(`^${key}:`, "m").test(frontmatter));
  if (missing.length) {
    console.error(`✗ ${entry.name}: missing frontmatter field(s): ${missing.join(", ")}`);
    hasError = true;
    continue;
  }

  console.log(`✓ ${entry.name}`);
}

if (hasError) process.exit(1);
