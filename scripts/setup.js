#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function run(label, cmd, opts = {}) {
  console.log(`\n==> ${label}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts });
    console.log(`    [OK] ${label}`);
    return true;
  } catch (err) {
    console.error(`    [FAIL] ${label}`);
    console.error(`    Command: ${cmd}`);
    console.error(`    ${err.message}`);
    return false;
  }
}

function hasCppFiles() {
  const pxtJsonPath = path.join(ROOT, "pxt.json");
  try {
    const pxtJson = JSON.parse(fs.readFileSync(pxtJsonPath, "utf8"));
    const files = pxtJson.files || [];
    return files.some((f) => f.endsWith(".cpp"));
  } catch {
    return false;
  }
}

function dockerImageExists(imageName) {
  try {
    const output = execSync(`docker images -q ${imageName}`, {
      encoding: "utf8",
    }).trim();
    return output.length > 0;
  } catch {
    return false;
  }
}

function main() {
  let failed = false;

  // Step 1: npm install
  if (!run("npm install", "npm install")) {
    failed = true;
  }

  // Step 2: pxt target microbit
  if (!run("pxt target microbit", "npx pxt target microbit")) {
    failed = true;
  }

  // Step 3: pxt install
  if (!run("pxt install", "npx pxt install")) {
    failed = true;
  }

  // Step 4-6: Check for C++ files and Docker image
  if (hasCppFiles()) {
    console.log("\n==> C++ files detected in pxt.json");
    if (!dockerImageExists("pext/yotta")) {
      console.log("    Docker image pext/yotta not found. Building...");
      const dockerDir = path.join(ROOT, "docker");
      if (!fs.existsSync(dockerDir)) {
        console.error(
          "    [FAIL] docker/ directory not found. Cannot build pext/yotta image."
        );
        failed = true;
      } else if (!run("Build pext/yotta Docker image", "make", { cwd: dockerDir })) {
        failed = true;
      }
    } else {
      console.log("    Docker image pext/yotta already exists. [OK]");
    }
  }

  console.log("");
  if (failed) {
    console.error("Setup completed with errors. Review the output above.");
    process.exit(1);
  } else {
    console.log("Setup completed successfully.");
  }
}

main();
