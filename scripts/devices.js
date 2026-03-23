#!/usr/bin/env node
"use strict";

/**
 * Enumerate connected micro:bit devices — local USB and remote bridge.
 * Merges both sources by serial number into a unified view.
 *
 * Usage:
 *   node scripts/devices.js              — list all devices
 *   node scripts/devices.js --detail     — include DAP firmware info
 *   node scripts/devices.js --json       — output as JSON
 */

const HID = require("node-hid");
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const MICROBIT_VENDOR_ID = 0x0d28;
const ROOT = path.resolve(__dirname, "..");

// ANSI colors
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
};

/** Extract serial number fields from a 48-char DAPLink serial. */
function parseSerial(serial) {
  if (!serial || serial.length < 32) return { full: serial, short: null, display: null };
  return {
    full: serial,
    short: serial.substring(16, 32),
    display: serial.substring(26, 32),
  };
}

// ── Local USB discovery ──────────────────────────────────────────────

function findSerialPorts() {
  const ports = {};
  try {
    const devs = fs.readdirSync("/dev").filter(
      (d) => d.startsWith("tty.usbmodem") || d.startsWith("cu.usbmodem")
    );
    for (const d of devs) {
      const prefix = d.startsWith("tty.") ? "tty" : "cu";
      const match = d.match(/usbmodem(\d+)/);
      if (match) {
        const key = match[1];
        if (!ports[key]) ports[key] = {};
        ports[key][prefix] = "/dev/" + d;
      }
    }
  } catch (e) {}
  return ports;
}

function findMountedVolumes() {
  const volumes = {};
  try {
    const vols = fs.readdirSync("/Volumes").filter((v) => v.startsWith("MICROBIT"));
    for (const v of vols) {
      const volPath = "/Volumes/" + v;
      const detailsPath = volPath + "/DETAILS.TXT";
      if (fs.existsSync(detailsPath)) {
        const text = fs.readFileSync(detailsPath, "utf8");
        const match = text.match(/Unique ID:\s*(\S+)/);
        if (match) {
          const failPath = volPath + "/FAIL.TXT";
          const fail = fs.existsSync(failPath)
            ? fs.readFileSync(failPath, "utf8").trim().split("\n")[0]
            : null;
          volumes[match[1]] = { volume: volPath, fail };
        }
      }
    }
  } catch (e) {}
  return volumes;
}

function findLocalDevices() {
  const allHid = HID.devices();
  const serialPorts = findSerialPorts();
  const mountedVolumes = findMountedVolumes();

  const seen = new Set();
  const devices = [];
  for (const d of allHid) {
    if (d.vendorId === MICROBIT_VENDOR_ID && d.serialNumber && !seen.has(d.serialNumber)) {
      seen.add(d.serialNumber);
      const vol = mountedVolumes[d.serialNumber] || null;
      const s = parseSerial(d.serialNumber);
      devices.push({
        serial: s,
        product: d.product || "micro:bit",
        hidPath: d.path,
        volume: vol ? vol.volume : null,
        flashError: vol ? vol.fail : null,
        ttyPort: null,
        cuPort: null,
      });
    }
  }

  // Assign serial ports by enumeration order
  const portKeys = Object.keys(serialPorts).sort();
  for (let i = 0; i < devices.length && i < portKeys.length; i++) {
    const p = serialPorts[portKeys[i]];
    devices[i].ttyPort = p.tty || null;
    devices[i].cuPort = p.cu || null;
  }

  return devices;
}

// ── Bridge discovery ─────────────────────────────────────────────────

function httpGetJson(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    mod.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
      });
    }).on("error", () => resolve(null));
  });
}

/** Read pxt.json config. Returns { bridgeUrl, deviceNames } or null. */
function readPxtConfig() {
  const pxtPath = path.join(ROOT, "pxt.json");
  if (!fs.existsSync(pxtPath)) return null;
  const pxt = JSON.parse(fs.readFileSync(pxtPath, "utf8"));
  return {
    bridgeUrl: (typeof pxt.bridge === "string") ? pxt.bridge : null,
    deviceNames: pxt.devices || {},  // shortSerial -> commonName
  };
}

async function findBridgeDevices(bridgeUrl) {
  if (!bridgeUrl) return null;

  const docs = await httpGetJson(bridgeUrl);
  if (!docs || !docs.session) return null;

  let devicesPath = null;
  for (const ep of (docs.endpoints || [])) {
    if (ep.name === "List Devices") { devicesPath = ep.path; break; }
  }
  if (!devicesPath) return null;

  const parsed = new URL(bridgeUrl);
  const result = await httpGetJson(parsed.origin + devicesPath);
  if (!result || !result.devices) return null;

  const devices = result.devices.map((d) => {
    const s = parseSerial(d.id);
    return {
      serial: s,
      announcedName: d.name || null,
      type: d.type || null,
      state: d.state || null,
    };
  });

  return { url: bridgeUrl, session: docs.session.key, devices };
}

// ── DAP detail ───────────────────────────────────────────────────────

async function getDetailedInfo(device) {
  const DAPjs = require("dapjs");
  try {
    const hid = new HID.HID(device.hidPath);
    const transport = new DAPjs.HID(hid);
    const daplink = new DAPjs.DAPLink(transport);
    await daplink.connect();
    device.firmwareVersion = await daplink.dapInfo(4);
    device.targetDevice = await daplink.dapInfo(6);
    await daplink.disconnect();
    hid.close();
  } catch (e) {
    device.dapError = e.message;
  }
  return device;
}

// ── Merge & display ──────────────────────────────────────────────────

function mergeDevices(local, bridge, deviceNames) {
  const merged = new Map(); // keyed by full serial

  for (const d of local) {
    merged.set(d.serial.full, {
      serial: d.serial,
      local: d,
      remote: null,
      configName: deviceNames[d.serial.short] || null,
    });
  }

  if (bridge) {
    for (const d of bridge.devices) {
      const key = d.serial.full;
      if (merged.has(key)) {
        const m = merged.get(key);
        m.remote = d;
        if (!m.configName && d.serial.short) {
          m.configName = deviceNames[d.serial.short] || null;
        }
      } else {
        merged.set(key, {
          serial: d.serial,
          local: null,
          remote: d,
          configName: deviceNames[d.serial.short] || null,
        });
      }
    }
  }

  return Array.from(merged.values());
}

function connectionBadge(device) {
  const hasLocal = !!device.local;
  const hasRemote = !!device.remote;
  if (hasLocal && hasRemote) {
    return `${C.bgMagenta}${C.white}${C.bold} LOCAL + BRIDGE ${C.reset}`;
  } else if (hasLocal) {
    return `${C.bgGreen}${C.white}${C.bold} LOCAL ${C.reset}`;
  } else {
    return `${C.bgBlue}${C.white}${C.bold} BRIDGE ${C.reset}`;
  }
}

function printDevices(devices, bridge, detail) {
  const bridgeStr = bridge
    ? `${C.dim}Bridge: ${bridge.url}${C.reset}`
    : `${C.dim}Bridge: not configured${C.reset}`;

  console.log();
  console.log(`${C.bold}micro:bit Devices${C.reset}  ${bridgeStr}`);
  console.log();

  if (devices.length === 0) {
    console.log(`  ${C.yellow}No devices found.${C.reset}`);
    console.log();
    return;
  }

  for (let i = 0; i < devices.length; i++) {
    const d = devices[i];
    const badge = connectionBadge(d);

    // Primary name: config name from pxt.json, or display serial as fallback
    const primaryName = d.configName
      ? `${C.bold}${C.white}${d.configName}${C.reset}`
      : `${C.dim}${d.serial.display}${C.reset}`;

    console.log(`  ${C.dim}${i + 1}.${C.reset} ${primaryName}  ${badge}  ${C.dim}[${d.serial.display}]${C.reset}`);
    console.log(`     ${C.dim}Short:${C.reset}    ${C.yellow}${d.serial.short}${C.reset}`);

    // Show device announcement if present
    if (d.remote && d.remote.announcedName) {
      console.log(`     ${C.dim}DEVICE:${C.reset}   ${C.cyan}${d.remote.announcedName}${C.reset}`);
    }

    // Remote state
    if (d.remote) {
      const stateColor = d.remote.state === "connected" ? C.green : C.yellow;
      console.log(`     ${C.dim}State:${C.reset}    ${stateColor}${d.remote.state}${C.reset}`);
    }

    // Local info
    if (d.local) {
      if (d.local.volume) console.log(`     ${C.dim}Volume:${C.reset}   ${C.green}${d.local.volume}${C.reset}`);
      if (d.local.ttyPort) console.log(`     ${C.dim}TTY:${C.reset}      ${d.local.ttyPort}`);
      if (d.local.flashError) console.log(`     ${C.bold}${C.yellow}FAIL:${C.reset}     ${d.local.flashError}`);
      if (detail && d.local.firmwareVersion) console.log(`     ${C.dim}Firmware:${C.reset} ${d.local.firmwareVersion}`);
      if (detail && d.local.targetDevice) console.log(`     ${C.dim}Target:${C.reset}   ${d.local.targetDevice}`);
      if (detail && d.local.dapError) console.log(`     ${C.dim}DAP Err:${C.reset}  ${d.local.dapError}`);
    }

    console.log();
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const detail = args.includes("--detail");
  const json = args.includes("--json");

  const config = readPxtConfig();
  const deviceNames = config ? config.deviceNames : {};
  const bridgeUrl = config ? config.bridgeUrl : null;

  const localDevices = findLocalDevices();

  if (detail) {
    for (let i = 0; i < localDevices.length; i++) {
      localDevices[i] = await getDetailedInfo(localDevices[i]);
    }
  }

  const bridge = await findBridgeDevices(bridgeUrl);
  const merged = mergeDevices(localDevices, bridge, deviceNames);

  if (json) {
    console.log(JSON.stringify({
      devices: merged,
      bridge: bridge ? { url: bridge.url, session: bridge.session } : null,
    }, null, 2));
    return;
  }

  printDevices(merged, bridge, detail);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
