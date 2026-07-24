#!/usr/bin/env node
// Validates that every <skills-dir>/<name>/SKILL.md has the required frontmatter fields.
// Covers the core pack (skills/) and any vertical packs staged under verticals/*/skills/.
const fs = require("fs");
const path = require("path");

const required = ["name", "description", "lane"];
let hasError = false;

function validateSkillsDir(skillsDir, label) {
  if (!fs.existsSync(skillsDir)) return;

  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
    const tag = `${label}${entry.name}`;
    if (!fs.existsSync(skillPath)) {
      console.error(`✗ ${tag}: missing SKILL.md`);
      hasError = true;
      continue;
    }

    const contents = fs.readFileSync(skillPath, "utf8");
    const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      console.error(`✗ ${tag}: SKILL.md has no frontmatter block`);
      hasError = true;
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    const missing = required.filter((key) => !new RegExp(`^${key}:`, "m").test(frontmatter));
    if (missing.length) {
      console.error(`✗ ${tag}: missing frontmatter field(s): ${missing.join(", ")}`);
      hasError = true;
      continue;
    }

    console.log(`✓ ${tag}`);
  }
}

const rootDir = path.join(__dirname, "..");

validateSkillsDir(path.join(rootDir, "skills"), "");

const verticalsDir = path.join(rootDir, "verticals");
if (fs.existsSync(verticalsDir)) {
  for (const entry of fs.readdirSync(verticalsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    validateSkillsDir(path.join(verticalsDir, entry.name, "skills"), `verticals/${entry.name}/skills/`);
  }
}

if (hasError) process.exit(1);
