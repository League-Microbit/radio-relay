#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

/**
 * Load environment variables from a .env file if it exists.
 * Simple line-by-line parser: KEY=VALUE, skip comments and empty lines.
 */
function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Only set if not already in environment (env takes precedence)
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

/**
 * POST hex file to bridge server using Node.js built-in http/https.
 */
function postToBridge(bridgeUrl, bridgeKey, hexData) {
  return new Promise((resolve, reject) => {
    const url = new URL("/api/hex", bridgeUrl);
    const mod = url.protocol === "https:" ? require("https") : require("http");

    const req = mod.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: bridgeKey,
          "Content-Type": "application/octet-stream",
          "Content-Length": Buffer.byteLength(hexData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body });
          } else {
            reject(
              new Error(
                `Bridge returned HTTP ${res.statusCode}: ${body}`
              )
            );
          }
        });
      }
    );

    req.on("error", reject);
    req.write(hexData);
    req.end();
  });
}

async function main() {
  // Step 1: Run build
  console.log("==> Running build...");
  try {
    execSync("node scripts/build.js", { stdio: "inherit", cwd: ROOT });
  } catch (err) {
    console.error("Build failed. Cannot deploy.");
    process.exit(1);
  }

  // Step 2: Load .env file if present
  loadEnvFile();

  const bridgeUrl = process.env.BRIDGE_URL;
  const bridgeKey = process.env.BRIDGE_KEY;

  // Step 3: Choose deploy path
  if (bridgeUrl && bridgeKey) {
    // Bridge deploy
    console.log(`\n==> Deploying via bridge: ${bridgeUrl}`);
    const hexPath = path.join(ROOT, "built", "binary.hex");
    if (!fs.existsSync(hexPath)) {
      console.error("Error: built/binary.hex not found. Build may have failed.");
      process.exit(1);
    }

    const hexData = fs.readFileSync(hexPath);
    try {
      const result = await postToBridge(bridgeUrl, bridgeKey, hexData);
      console.log(`    Bridge responded: HTTP ${result.statusCode}`);
      if (result.body) console.log(`    ${result.body}`);
      console.log("\nDeploy path: bridge (HTTP POST)");
    } catch (err) {
      console.error(`\nBridge deploy failed: ${err.message}`);
      process.exit(1);
    }
  } else {
    // Local USB deploy via pxt
    if (!bridgeUrl && !bridgeKey) {
      console.log(
        "\n==> BRIDGE_URL and BRIDGE_KEY not set. Using local USB deploy."
      );
    } else {
      console.log(
        "\n==> BRIDGE_URL or BRIDGE_KEY missing. Using local USB deploy."
      );
    }

    try {
      execSync("npx pxt deploy", { stdio: "inherit", cwd: ROOT });
      console.log("\nDeploy path: local USB (pxt deploy)");
    } catch (err) {
      console.error("\nLocal deploy failed.");
      process.exit(1);
    }
  }
}

main();
