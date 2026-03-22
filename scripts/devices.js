#!/usr/bin/env node
"use strict";

/**
 * Enumerate connected micro:bit devices using DAPjs + node-hid.
 *
 * Usage:
 *   node scripts/devices.js              — list connected micro:bits
 *   node scripts/devices.js --detail     — list with DAP debug info (serial, firmware, target)
 *   node scripts/devices.js --json       — output as JSON
 */

const HID = require("node-hid");
const fs = require("fs");

const MICROBIT_VENDOR_ID = 0x0d28;

/**
 * Find serial ports (tty/cu) that belong to micro:bit devices.
 * Returns a map of serialNumber -> { tty, cu } paths.
 */
function findSerialPorts() {
  const ports = {};
  try {
    const devs = fs.readdirSync("/dev").filter(
      (d) => d.startsWith("tty.usbmodem") || d.startsWith("cu.usbmodem")
    );
    for (const d of devs) {
      const fullPath = "/dev/" + d;
      const prefix = d.startsWith("tty.") ? "tty" : "cu";
      // Group by the numeric suffix (e.g., 21431402)
      const match = d.match(/usbmodem(\d+)/);
      if (match) {
        const key = match[1];
        if (!ports[key]) ports[key] = {};
        ports[key][prefix] = fullPath;
      }
    }
  } catch (e) {
    // /dev not readable
  }
  return ports;
}

/**
 * Find mounted MICROBIT volumes and read their DETAILS.TXT to get Unique IDs.
 * Returns a map of serialNumber -> { volume, details }.
 */
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
  } catch (e) {
    // /Volumes not readable
  }
  return volumes;
}

function findMicrobits() {
  const allDevices = HID.devices();
  const serialPorts = findSerialPorts();
  const mountedVolumes = findMountedVolumes();

  // Filter to micro:bit devices, deduplicate by serialNumber
  const seen = new Set();
  const microbits = [];
  for (const d of allDevices) {
    if (d.vendorId === MICROBIT_VENDOR_ID && d.serialNumber && !seen.has(d.serialNumber)) {
      seen.add(d.serialNumber);

      // Match mounted volume by serial number
      const volInfo = mountedVolumes[d.serialNumber] || null;

      const mb = {
        serialNumber: d.serialNumber,
        product: d.product || "micro:bit",
        hidPath: d.path,
        vendorId: d.vendorId,
        productId: d.productId,
        shortSerial: d.serialNumber.substring(16, 32),
        displaySerial: d.serialNumber.substring(26, 32),
        volume: volInfo ? volInfo.volume : null,
        flashError: volInfo ? volInfo.fail : null,
      };

      microbits.push(mb);
    }
  }

  // Assign serial ports to devices by matching order
  // (HID and serial ports enumerate in the same USB tree order)
  const portKeys = Object.keys(serialPorts).sort();
  for (let i = 0; i < microbits.length && i < portKeys.length; i++) {
    const p = serialPorts[portKeys[i]];
    microbits[i].ttyPort = p.tty || null;
    microbits[i].cuPort = p.cu || null;
  }

  return microbits;
}

async function getDetailedInfo(device) {
  const DAPjs = require("dapjs");
  try {
    const hid = new HID.HID(device.path);
    const transport = new DAPjs.HID(hid);
    const daplink = new DAPjs.DAPLink(transport);
    await daplink.connect();

    const info = {
      ...device,
      dapVendor: await daplink.dapInfo(1),       // VENDOR_ID
      dapProduct: await daplink.dapInfo(2),       // PRODUCT_ID
      dapSerial: await daplink.dapInfo(3),        // SERIAL_NUMBER
      firmwareVersion: await daplink.dapInfo(4),  // CMSIS_DAP_FW_VERSION
      targetVendor: await daplink.dapInfo(5),     // TARGET_DEVICE_VENDOR
      targetDevice: await daplink.dapInfo(6),     // TARGET_DEVICE_NAME
    };

    await daplink.disconnect();
    hid.close();
    return info;
  } catch (e) {
    return { ...device, error: e.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const detail = args.includes("--detail");
  const json = args.includes("--json");

  const devices = findMicrobits();

  if (devices.length === 0) {
    if (json) {
      console.log("[]");
    } else {
      console.log("No micro:bit devices found.");
    }
    return;
  }

  let results;
  if (detail) {
    results = [];
    for (const d of devices) {
      results.push(await getDetailedInfo(d));
    }
  } else {
    results = devices;
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`Found ${results.length} micro:bit(s):\n`);
    for (const d of results) {
      console.log(`  ${d.product}`);
      console.log(`    Serial:  ${d.serialNumber}`);
      console.log(`    Short:   ${d.shortSerial}`);
      console.log(`    Display: ${d.displaySerial}`);
      if (d.volume) console.log(`    Volume:  ${d.volume}`);
      if (d.ttyPort) console.log(`    TTY:     ${d.ttyPort}`);
      if (d.cuPort) console.log(`    CU:      ${d.cuPort}`);
      if (d.flashError) console.log(`    FAIL:    ${d.flashError}`);
      if (detail && !d.error) {
        console.log(`    Firmware: ${d.firmwareVersion}`);
        console.log(`    Target:   ${d.targetDevice}`);
        console.log(`    DAP ID:   ${d.dapSerial}`);
      }
      if (d.error) {
        console.log(`    Error:  ${d.error}`);
      }
      console.log();
    }
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
