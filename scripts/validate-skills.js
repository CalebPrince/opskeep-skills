#!/usr/bin/env node
// Validates every <skills-dir>/<name>/SKILL.md against the Agent Skills open standard
// (https://agentskills.io/specification): required top-level frontmatter fields, name
// format/length, and that this pack's custom `lane` field lives under `metadata` rather
// than as an unrecognized top-level key. Covers the core pack (skills/) and any vertical
// packs staged under verticals/*/skills/.
const fs = require("fs");
const path = require("path");

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
let hasError = false;

function validateSkillsDir(skillsDir, label) {
  if (!fs.existsSync(skillsDir)) return;

  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
    const tag = `${label}${entry.name}`;
    const errors = [];

    if (!fs.existsSync(skillPath)) {
      console.error(`✗ ${tag}: missing SKILL.md`);
      hasError = true;
      continue;
    }

    const contents = fs.readFileSync(skillPath, "utf8");
    const frontmatterMatch = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatterMatch) {
      console.error(`✗ ${tag}: SKILL.md has no frontmatter block`);
      hasError = true;
      continue;
    }

    const frontmatter = frontmatterMatch[1];

    const nameMatch = frontmatter.match(/^name:\s*(\S+)\s*$/m);
    if (!nameMatch) {
      errors.push("missing top-level field: name");
    } else {
      const name = nameMatch[1];
      if (name.length > 64) errors.push(`name exceeds 64 characters: ${name}`);
      if (!NAME_PATTERN.test(name)) errors.push(`name fails spec pattern (lowercase, hyphens, no leading/trailing/double hyphen): ${name}`);
      if (name !== entry.name) errors.push(`name "${name}" does not match parent directory "${entry.name}"`);
    }

    if (!/^description:/m.test(frontmatter)) {
      errors.push("missing top-level field: description");
    }

    const hasMetadataBlock = /^metadata:\s*$/m.test(frontmatter);
    const hasMetadataLane = /^\s+lane:\s*\S+/m.test(frontmatter);
    if (!hasMetadataBlock || !hasMetadataLane) {
      errors.push("missing metadata.lane (this pack's routing field belongs under metadata:, not top-level)");
    }

    if (/^lane:/m.test(frontmatter)) {
      errors.push("lane is top-level, not spec-conformant; move it under metadata:");
    }

    if (errors.length) {
      console.error(`✗ ${tag}: ${errors.join("; ")}`);
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
