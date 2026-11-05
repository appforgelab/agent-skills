#!/usr/bin/env node
// Validates every skill directory: SKILL.md frontmatter and agents/openai.yaml.
// Usage: node scripts/check-skills.mjs [root] — defaults to the repo root.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parse } from "yaml";

const root = resolve(process.argv[2] ?? join(import.meta.dirname, ".."));
const MAX_DESCRIPTION = 1024;
// Repository directories that are not skill folders.
const IGNORED_DIRS = new Set(["node_modules", "scripts"]);

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readYaml(file, text) {
  try {
    return parse(text) ?? {};
  } catch (error) {
    fail(file, `not valid YAML: ${error.message.split("\n")[0]}`);
    return null;
  }
}

function checkSkill(dir) {
  const name = basename(dir);
  const skillFile = join(dir, "SKILL.md");
  if (!existsSync(skillFile)) {
    fail(name, "missing SKILL.md");
    return;
  }

  const text = readFileSync(skillFile, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  let frontmatter = null;
  if (!match) {
    fail(skillFile, "missing --- frontmatter markers at the top");
  } else {
    frontmatter = readYaml(skillFile, match[1]);
  }

  if (frontmatter !== null) {
    if (!isPlainObject(frontmatter)) {
      fail(skillFile, "frontmatter must be a YAML mapping");
      return;
    }
    if (typeof frontmatter.name !== "string" || !frontmatter.name.trim()) {
      fail(skillFile, "frontmatter `name` is required");
    } else {
      if (frontmatter.name !== name) {
        fail(
          skillFile,
          `frontmatter name "${frontmatter.name}" does not match the directory "${name}"`,
        );
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name)) {
        fail(
          skillFile,
          "`name` may only contain lowercase letters, digits and single hyphens, not at the start or end",
        );
      }
      if (frontmatter.name.length > 64) {
        fail(skillFile, "`name` must be at most 64 characters");
      }
    }
    if (typeof frontmatter.description !== "string" || !frontmatter.description.trim()) {
      fail(skillFile, "frontmatter `description` is required");
    } else if (frontmatter.description.length > MAX_DESCRIPTION) {
      fail(
        skillFile,
        `description is ${frontmatter.description.length} chars, over the ${MAX_DESCRIPTION} limit`,
      );
    }
    if (frontmatter.metadata !== undefined) {
      if (!isPlainObject(frontmatter.metadata)) {
        fail(skillFile, "`metadata` must be a mapping");
      } else if (frontmatter.metadata.harness !== undefined) {
        const harness = frontmatter.metadata.harness;
        if (
          !Array.isArray(harness) ||
          harness.length === 0 ||
          harness.some((entry) => typeof entry !== "string" || !entry.trim())
        ) {
          fail(skillFile, "`metadata.harness` must be a non-empty array of non-empty strings");
        }
      }
    }
  }

  const agentFile = join(dir, "agents", "openai.yaml");
  if (existsSync(agentFile)) {
    const doc = readYaml(agentFile, readFileSync(agentFile, "utf8"));
    if (doc !== null) {
      const iface = isPlainObject(doc) ? doc.interface : undefined;
      if (!isPlainObject(iface)) {
        fail(agentFile, "`interface` mapping is required");
      } else {
        for (const key of ["display_name", "short_description"]) {
          if (typeof iface[key] !== "string" || !iface[key].trim()) {
            fail(agentFile, `interface.${key} must be a non-empty string`);
          }
        }
      }
    }
  }
}

// The root is either a folder of skill folders (the repo) or a single skill.
const skillDirs = existsSync(join(root, "SKILL.md"))
  ? [root]
  : readdirSync(root, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.name.startsWith(".") &&
          !entry.name.startsWith("_") &&
          !IGNORED_DIRS.has(entry.name),
      )
      .map((entry) => join(root, entry.name));

for (const dir of skillDirs) {
  checkSkill(dir);
}

if (failures.length > 0) {
  console.error(`check-skills: ${failures.length} problem(s):`);
  for (const problem of failures) {
    console.error(`  - ${problem}`);
  }
  process.exitCode = 1;
} else if (skillDirs.length === 0) {
  console.error("check-skills: no skill folders found — nothing validated");
  process.exitCode = 1;
} else {
  console.log(`check-skills: OK (${skillDirs.length} skills)`);
}
