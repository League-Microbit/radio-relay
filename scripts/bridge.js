#!/usr/bin/env node
"use strict";

/**
 * Bridge console CLI — interact with micro:bits via the bridge.
 * Reads bridge URL from pxt.json, device names from pxt.json devices.
 *
 * Usage:
 *   node scripts/bridge.js devices                    — list bridge devices
 *   node scripts/bridge.js serial <device> [lines]    — read serial (default last 20 lines)
 *   node scripts/bridge.js send <device> <message>    — send serial message
 *   node scripts/bridge.js flash <device> [hexfile]   — flash hex to device
 *   node scripts/bridge.js reset <device>             — reset device
 *   node scripts/bridge.js watch <device>             — poll serial continuously
 *   node scripts/bridge.js docs                       — show bridge API docs
 *
 * <device> can be: a name from pxt.json devices, a display serial (6 chars),
 * a short serial (16 chars), or "all" for broadcast flash.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");

// ── Config ───────────────────────────────────────────────

function loadConfig() {
  const pxtPath = path.join(ROOT, "pxt.json");
  if (!fs.existsSync(pxtPath)) {
    console.error("Error: pxt.json not found");
    process.exit(1);
  }
  const pxt = JSON.parse(fs.readFileSync(pxtPath, "utf8"));
  const bridgeUrl = typeof pxt.bridge === "string" ? pxt.bridge : null;
  if (!bridgeUrl) {
    console.error("Error: no bridge URL in pxt.json");
    process.exit(1);
  }
  return {
    bridgeUrl,
    deviceNames: pxt.devices || {},
  };
}

// ── HTTP helpers ─────────────────────────────────────────

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    }).on("error", reject);
  });
}

function httpPost(url, contentType, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.request(parsed, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpPostBinary(url, filename, data) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const req = mod.request(parsed, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Filename": filename,
        "Content-Length": data.length,
      },
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(body); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ── Bridge API ───────────────────────────────────────────

async function getBridgeDocs(bridgeUrl) {
  return await httpGet(bridgeUrl);
}

async function getSessionKey(bridgeUrl) {
  const docs = await getBridgeDocs(bridgeUrl);
  if (docs && docs.session) return docs.session.key;
  console.error("Error: could not get session key from bridge");
  process.exit(1);
}

async function listDevices(bridgeUrl) {
  const key = await getSessionKey(bridgeUrl);
  const parsed = new URL(bridgeUrl);
  const result = await httpGet(`${parsed.origin}/api/bridge/session/${key}/devices`);
  return result.devices || [];
}

async function resolveDevice(bridgeUrl, deviceNames, ref) {
  const devices = await listDevices(bridgeUrl);

  // Try matching by: pxt.json name, display serial, short serial, full ID, announced name
  for (const dev of devices) {
    const short = dev.id ? dev.id.substring(16, 32) : "";
    const display = dev.id ? dev.id.substring(26, 32) : "";

    // Check pxt.json device names (short serial -> name)
    for (const [shortKey, name] of Object.entries(deviceNames)) {
      if (name.toLowerCase() === ref.toLowerCase() && shortKey === short) {
        return dev;
      }
    }
  }

  // Direct match on display serial, short serial, full ID, or announced name
  for (const dev of devices) {
    const short = dev.id ? dev.id.substring(16, 32) : "";
    const display = dev.id ? dev.id.substring(26, 32) : "";
    if (ref === display || ref === short || ref === dev.id) return dev;
    if (dev.name && dev.name.toLowerCase().includes(ref.toLowerCase())) return dev;
  }

  return null;
}

// ── Commands ─────────────────────────────────────────────

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m",
  cyan: "\x1b[36m", white: "\x1b[37m",
};

async function cmdDevices(config) {
  const devices = await listDevices(config.bridgeUrl);
  if (devices.length === 0) {
    console.log("No devices connected to bridge.");
    return;
  }
  console.log(`\n${C.bold}Bridge Devices${C.reset} (${config.bridgeUrl})\n`);
  for (let i = 0; i < devices.length; i++) {
    const dev = devices[i];
    const short = dev.id ? dev.id.substring(16, 32) : "?";
    const display = dev.id ? dev.id.substring(26, 32) : "?";
    const configName = config.deviceNames[short] || null;
    const label = configName ? `${C.bold}${configName}${C.reset}` : `${C.dim}${display}${C.reset}`;
    const announced = dev.name ? `${C.cyan}${dev.name}${C.reset}` : "";
    const state = dev.state === "connected" ? `${C.green}connected${C.reset}` : `${C.yellow}${dev.state}${C.reset}`;

    console.log(`  ${C.dim}${i + 1}.${C.reset} ${label}  [${C.yellow}${display}${C.reset}]  ${state}`);
    if (announced) console.log(`     ${C.dim}DEVICE:${C.reset} ${announced}`);
    console.log(`     ${C.dim}Short:${C.reset}  ${short}`);
    console.log();
  }
}

async function cmdSerial(config, ref, lineCount) {
  const dev = await resolveDevice(config.bridgeUrl, config.deviceNames, ref);
  if (!dev) { console.error(`Device "${ref}" not found`); process.exit(1); }

  const key = await getSessionKey(config.bridgeUrl);
  const parsed = new URL(config.bridgeUrl);
  const result = await httpGet(`${parsed.origin}/api/bridge/session/${key}/serial/${dev.id}`);
  const lines = (result.lines || []).map(l => l.replace(/\r/g, "").trim()).filter(l => l);
  const show = lines.slice(-lineCount);
  show.forEach(l => console.log(l));
}

async function cmdSend(config, ref, message) {
  const dev = await resolveDevice(config.bridgeUrl, config.deviceNames, ref);
  if (!dev) { console.error(`Device "${ref}" not found`); process.exit(1); }

  const key = await getSessionKey(config.bridgeUrl);
  const parsed = new URL(config.bridgeUrl);
  const result = await httpPost(
    `${parsed.origin}/api/bridge/session/${key}/serial/${dev.id}`,
    "application/json",
    JSON.stringify({ data: message + "\n" })
  );
  console.log(`Sent to ${ref}: ${JSON.stringify(message)}`);
}

async function cmdFlash(config, ref, hexFile) {
  const hexPath = hexFile || path.join(ROOT, "built", "binary.hex");
  if (!fs.existsSync(hexPath)) {
    console.error(`Hex file not found: ${hexPath}`);
    process.exit(1);
  }
  const hexData = fs.readFileSync(hexPath);
  const key = await getSessionKey(config.bridgeUrl);
  const parsed = new URL(config.bridgeUrl);

  if (ref === "all") {
    const result = await httpPostBinary(
      `${parsed.origin}/api/bridge/hex/${key}`,
      path.basename(hexPath), hexData
    );
    console.log(`Broadcast flash: ${hexData.length} bytes`);
    console.log(JSON.stringify(result));
    return;
  }

  const dev = await resolveDevice(config.bridgeUrl, config.deviceNames, ref);
  if (!dev) { console.error(`Device "${ref}" not found`); process.exit(1); }

  const result = await httpPostBinary(
    `${parsed.origin}/api/bridge/hex/${key}/${dev.id}`,
    path.basename(hexPath), hexData
  );
  console.log(`Flashed ${hexData.length} bytes to ${ref}`);
  console.log(JSON.stringify(result));
}

async function cmdReset(config, ref) {
  const dev = await resolveDevice(config.bridgeUrl, config.deviceNames, ref);
  if (!dev) { console.error(`Device "${ref}" not found`); process.exit(1); }

  const key = await getSessionKey(config.bridgeUrl);
  const parsed = new URL(config.bridgeUrl);
  const result = await httpPost(
    `${parsed.origin}/api/bridge/session/${key}/reset/${dev.id}`,
    "application/json", "{}"
  );
  console.log(`Reset ${ref}`);
}

async function cmdWatch(config, ref, filterPrefix) {
  const dev = await resolveDevice(config.bridgeUrl, config.deviceNames, ref);
  if (!dev) { console.error(`Device "${ref}" not found`); process.exit(1); }

  const key = await getSessionKey(config.bridgeUrl);
  const parsed = new URL(config.bridgeUrl);
  const url = `${parsed.origin}/api/bridge/session/${key}/serial/${dev.id}`;

  let lastLineCount = 0;
  console.log(`Watching ${ref}... (Ctrl+C to stop)\n`);

  setInterval(async () => {
    try {
      const result = await httpGet(url);
      const lines = (result.lines || []).map(l => l.replace(/\r/g, "").trim()).filter(l => l);
      if (lines.length > lastLineCount) {
        const newLines = lines.slice(lastLineCount);
        for (const l of newLines) {
          if (!filterPrefix || l.startsWith(filterPrefix)) {
            console.log(l);
          }
        }
        lastLineCount = lines.length;
      }
    } catch (e) { /* ignore polling errors */ }
  }, 500);
}

async function cmdDocs(config) {
  const docs = await getBridgeDocs(config.bridgeUrl);
  console.log(JSON.stringify(docs, null, 2));
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log(`
Bridge CLI — interact with micro:bits via the bridge console.

Usage:
  bridge devices                     List connected devices
  bridge serial <device> [n]         Show last n serial lines (default 20)
  bridge send <device> <message>     Send serial message
  bridge flash <device> [hexfile]    Flash hex (default: built/binary.hex)
  bridge reset <device>              Reset device
  bridge watch <device> [prefix]     Poll serial continuously (optional prefix filter)
  bridge docs                        Show raw bridge API docs

<device>: name from pxt.json, display serial (6 chars), or short serial (16 chars)
`);
    return;
  }

  const config = loadConfig();

  switch (cmd) {
    case "devices":
      await cmdDevices(config);
      break;
    case "serial":
      await cmdSerial(config, args[1], parseInt(args[2]) || 20);
      break;
    case "send":
      await cmdSend(config, args[1], args.slice(2).join(" "));
      break;
    case "flash":
      await cmdFlash(config, args[1], args[2]);
      break;
    case "reset":
      await cmdReset(config, args[1]);
      break;
    case "watch":
      await cmdWatch(config, args[1], args[2]);
      break;
    case "docs":
      await cmdDocs(config);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
