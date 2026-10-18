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

    // Installers parse frontmatter as real YAML and silently skip a skill whose
    // header fails. An unquoted value containing ": " or " #" (or starting with a
    // YAML indicator) is the usual cause, so catch it here.
    for (const line of frontmatter.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][\w-]*):[ \t]+(.+)$/);
      if (!m) continue;
      const value = m[2].trim();
      if (/^["'|>]/.test(value)) continue;
      if (/: /.test(value) || / #/.test(value) || /^[\[{&*!%@`,?-]/.test(value)) {
        errors.push(`top-level "${m[1]}" is an unquoted value YAML can't parse (contains ": ", " #", or starts with a YAML indicator); wrap it in double quotes`);
      }
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

// The update notice compares whats-new.json (fetched from main) against each
// installed router's metadata.pack_version, so all of them must agree with
// package.json or installers get a wrong (or missing) "new version" notice.
function checkPackVersions() {
  const pkgVersion = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8")).version;
  const whatsNewPath = path.join(rootDir, "whats-new.json");
  const errors = [];

  if (!fs.existsSync(whatsNewPath)) {
    errors.push("whats-new.json is missing");
  } else {
    const whatsNew = JSON.parse(fs.readFileSync(whatsNewPath, "utf8"));
    if (whatsNew.version !== pkgVersion) {
      errors.push(`whats-new.json version ${whatsNew.version} != package.json ${pkgVersion}`);
    }
    if (!whatsNew.headline || !Array.isArray(whatsNew.highlights) || whatsNew.highlights.length === 0) {
      errors.push("whats-new.json needs a headline and at least one highlight");
    }
  }

  const routers = [path.join(rootDir, "skills", "opskeep", "SKILL.md")];
  if (fs.existsSync(verticalsDir)) {
    for (const entry of fs.readdirSync(verticalsDir, { withFileTypes: true })) {
      const router = path.join(verticalsDir, entry.name, "skills", entry.name, "SKILL.md");
      if (entry.isDirectory() && fs.existsSync(router)) routers.push(router);
    }
  }
  for (const router of routers) {
    const match = fs.readFileSync(router, "utf8").match(/^\s+pack_version:\s*(\S+)\s*$/m);
    const rel = path.relative(rootDir, router);
    if (!match) errors.push(`${rel}: missing metadata.pack_version`);
    else if (match[1] !== pkgVersion) errors.push(`${rel}: pack_version ${match[1]} != package.json ${pkgVersion}`);
  }

  if (errors.length) {
    errors.forEach((e) => console.error(`✗ pack version: ${e}`));
    hasError = true;
  } else {
    console.log(`✓ pack version ${pkgVersion} matches whats-new.json and ${routers.length} router(s)`);
  }
}

checkPackVersions();

if (hasError) process.exit(1);
