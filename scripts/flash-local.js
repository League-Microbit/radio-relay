#!/usr/bin/env node
"use strict";

/**
 * Flash a .hex file to locally-attached micro:bits via their mounted volumes.
 *
 * Usage:
 *   node scripts/flash-local.js                  — flash to all MICROBIT volumes
 *   node scripts/flash-local.js "MICROBIT 1"     — flash to a specific volume
 *   node scripts/flash-local.js --list            — list available volumes
 *
 * Handles macOS extended attribute errors by using raw read/write streams
 * instead of fs.copyFileSync.
 */

const fs = require("fs");
const path = require("path");

const HEX_PATH = path.resolve(__dirname, "..", "built", "binary.hex");

function findMicrobitVolumes() {
  try {
    return fs.readdirSync("/Volumes")
      .filter(v => v.startsWith("MICROBIT"))
      .map(v => path.join("/Volumes", v));
  } catch (e) {
    return [];
  }
}

function readDetails(volumePath) {
  const detailsPath = path.join(volumePath, "DETAILS.TXT");
  if (!fs.existsSync(detailsPath)) return null;
  const text = fs.readFileSync(detailsPath, "utf8");
  const info = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^(.+?):\s*(.+)$/);
    if (match) info[match[1].trim()] = match[2].trim();
  }
  return info;
}

function checkFail(volumePath) {
  const failPath = path.join(volumePath, "FAIL.TXT");
  if (fs.existsSync(failPath)) {
    const text = fs.readFileSync(failPath, "utf8").trim();
    return text;
  }
  return null;
}

function flashTo(volumePath) {
  const dest = path.join(volumePath, "binary.hex");
  const data = fs.readFileSync(HEX_PATH);

  // Show device info
  const details = readDetails(volumePath);
  if (details && details["Unique ID"]) {
    console.log(`  Device: ${details["Unique ID"].slice(0, 16)}...`);
  }

  // Check for prior flash failure
  const priorFail = checkFail(volumePath);
  if (priorFail) {
    console.log(`  Warning: prior FAIL.TXT: ${priorFail}`);
  }

  fs.writeFileSync(dest, data);
  console.log(`  Flashed ${data.length} bytes to ${volumePath}`);
}

// CLI
const args = process.argv.slice(2);

if (!fs.existsSync(HEX_PATH)) {
  console.error("Error: built/binary.hex not found. Run 'npm run build' first.");
  process.exit(1);
}

if (args[0] === "--list") {
  const vols = findMicrobitVolumes();
  if (vols.length === 0) {
    console.log("No MICROBIT volumes found.");
  } else {
    console.log("Available volumes:");
    for (const v of vols) {
      const details = readDetails(v);
      const uid = details && details["Unique ID"] ? ` (${details["Unique ID"].slice(0, 16)}...)` : "";
      const fail = checkFail(v);
      const failMsg = fail ? ` [FAIL: ${fail.split("\n")[0]}]` : "";
      console.log(`  ${v}${uid}${failMsg}`);
    }
  }
  process.exit(0);
}

let targets;
if (args.length > 0) {
  // Specific volume name(s) provided
  targets = args.map(name => {
    if (name.startsWith("/")) return name;
    return path.join("/Volumes", name);
  });
} else {
  targets = findMicrobitVolumes();
}

if (targets.length === 0) {
  console.error("No micro:bit volumes found. Is a micro:bit connected via USB?");
  process.exit(1);
}

console.log(`Flashing ${HEX_PATH} (${fs.statSync(HEX_PATH).size} bytes)`);
let errors = 0;
for (const vol of targets) {
  try {
    flashTo(vol);
  } catch (e) {
    console.error(`  Failed to flash to ${vol}: ${e.message}`);
    errors++;
  }
}

if (errors > 0) {
  process.exit(1);
}
console.log("Done.");
