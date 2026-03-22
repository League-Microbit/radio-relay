#!/usr/bin/env node
"use strict";

/**
 * lint-pxt-files.js — Verify that pxt.json files/testFiles match the filesystem.
 *
 * Rules:
 *   - Every .ts file in src/ EXCEPT src/main.ts must be in pxt.json "files"
 *   - src/main.ts (if it exists) must be in pxt.json "testFiles"
 *   - Every .cpp file in src/ must be in pxt.json "files"
 *   - Every .ts file in test/ must be in pxt.json "testFiles"
 *   - Files listed in pxt.json that don't exist on disk produce a warning (non-fatal)
 *
 * Exit 0 = pass, Exit 1 = missing file(s).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PXT_PATH = path.join(ROOT, "pxt.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect files under `dir` that match any of `extensions`. */
function collectFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(path.relative(ROOT, full));
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!fs.existsSync(PXT_PATH)) {
    console.error("ERROR: pxt.json not found at", PXT_PATH);
    process.exit(1);
  }

  const pxt = JSON.parse(fs.readFileSync(PXT_PATH, "utf-8"));
  const files = pxt.files || [];
  const testFiles = pxt.testFiles || [];

  const filesSet = new Set(files);
  const testFilesSet = new Set(testFiles);

  let errors = 0;
  let warnings = 0;

  // --- Scan src/ ---
  const srcFiles = collectFiles(path.join(ROOT, "src"), [".ts", ".cpp"]);

  for (const rel of srcFiles) {
    if (rel === "src/main.ts") {
      // main.ts belongs in testFiles
      if (!testFilesSet.has(rel)) {
        console.error(
          `ERROR: ${rel} exists but is not listed in pxt.json "testFiles"`
        );
        errors++;
      }
    } else {
      // All other .ts and .cpp files belong in files
      if (!filesSet.has(rel)) {
        console.error(
          `ERROR: ${rel} exists but is not listed in pxt.json "files"`
        );
        errors++;
      }
    }
  }

  // --- Scan test/ ---
  const testDirFiles = collectFiles(path.join(ROOT, "test"), [".ts"]);

  for (const rel of testDirFiles) {
    if (!testFilesSet.has(rel)) {
      console.error(
        `ERROR: ${rel} exists but is not listed in pxt.json "testFiles"`
      );
      errors++;
    }
  }

  // --- Warn about phantom entries ---
  const allDisk = new Set([...srcFiles, ...testDirFiles]);

  for (const f of files) {
    // Only check src/ ts/cpp entries (skip README.md etc.)
    if ((f.startsWith("src/") || f.startsWith("test/")) && !allDisk.has(f)) {
      console.warn(`WARN: pxt.json "files" lists "${f}" but it does not exist on disk`);
      warnings++;
    }
  }
  for (const f of testFiles) {
    if ((f.startsWith("src/") || f.startsWith("test/")) && !allDisk.has(f)) {
      console.warn(
        `WARN: pxt.json "testFiles" lists "${f}" but it does not exist on disk`
      );
      warnings++;
    }
  }

  // --- Summary ---
  if (errors > 0) {
    console.error(`\npxt.json lint: ${errors} error(s), ${warnings} warning(s)`);
    process.exit(1);
  }

  if (warnings > 0) {
    console.log(`pxt.json lint: OK (${warnings} warning(s))`);
  } else {
    console.log("pxt.json lint: OK");
  }
  process.exit(0);
}

main();
