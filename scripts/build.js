#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

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
  // Set environment variables
  process.env.PXT_FORCE_LOCAL = "1";
  // V2 only — skip V1/DAL build path, use CODAL exclusively
  process.env.PXT_COMPILE_SWITCHES = "csv---mbcodal";

  // Check C++ / Docker precondition
  if (hasCppFiles()) {
    console.log("C++ files detected in pxt.json files array.");
    if (!dockerImageExists("pxt/yotta")) {
      console.error(
        "Error: C++ compilation requires the Docker image. Run `npm run setup`."
      );
      process.exit(1);
    }
    console.log("Docker image pxt/yotta found. [OK]");
  }

  // Run pxt build
  console.log("\n==> Building project...");
  try {
    execSync("npx pxt build", { stdio: "inherit", cwd: ROOT });
  } catch (err) {
    console.error("\nBuild failed.");
    process.exit(1);
  }

  // Report hex file location and size
  const hexPath = path.join(ROOT, "built", "binary.hex");
  if (fs.existsSync(hexPath)) {
    const stats = fs.statSync(hexPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`\nBuild succeeded.`);
    console.log(`  Hex file: built/binary.hex`);
    console.log(`  Size:     ${sizeKB} KB (${stats.size} bytes)`);
  } else {
    console.log("\nBuild succeeded, but built/binary.hex was not found.");
    console.log("Check the built/ directory for output files.");
  }
}

main();
