#!/usr/bin/env node
"use strict";

/**
 * Serial communication with a micro:bit via USB.
 *
 * Usage:
 *   node scripts/serial.js list          — list serial ports
 *   node scripts/serial.js read PORT     — read serial output
 *   node scripts/serial.js send PORT MSG — send a message (appends \n)
 *   node scripts/serial.js echo PORT MSG — send and read for 3 seconds
 */

const fs = require("fs");

const BAUD = 115200;

function listPorts() {
  const devs = fs.readdirSync("/dev").filter(
    (d) => d.startsWith("cu.usbmodem") || d.startsWith("tty.usbmodem")
  );
  if (devs.length === 0) {
    console.log("No micro:bit serial ports found.");
  } else {
    devs.forEach((d) => console.log("/dev/" + d));
  }
}

function openPort(portPath) {
  // Use fs.open with O_RDWR | O_NOCTTY | O_NONBLOCK
  // O_RDWR=2, O_NOCTTY=0x20000, O_NONBLOCK=0x0004
  const fd = fs.openSync(portPath, fs.constants.O_RDWR | fs.constants.O_NOCTTY | fs.constants.O_NONBLOCK);
  return fd;
}

function readPort(portPath, durationMs) {
  const duration = durationMs || 5000;
  const fd = openPort(portPath);
  const buf = Buffer.alloc(4096);
  const end = Date.now() + duration;

  console.log(`Reading from ${portPath} for ${duration / 1000}s...`);

  const interval = setInterval(() => {
    try {
      const n = fs.readSync(fd, buf, 0, buf.length);
      if (n > 0) {
        process.stdout.write(buf.slice(0, n).toString("utf8"));
      }
    } catch (e) {
      if (e.code !== "EAGAIN" && e.code !== "EWOULDBLOCK") {
        console.error("Read error:", e.message);
        clearInterval(interval);
        fs.closeSync(fd);
        process.exit(1);
      }
    }
    if (Date.now() > end) {
      clearInterval(interval);
      fs.closeSync(fd);
      console.log("\n--- done ---");
    }
  }, 50);
}

function sendMessage(portPath, message) {
  const fd = openPort(portPath);
  const data = message + "\n";
  fs.writeSync(fd, data);
  console.log(`Sent: ${JSON.stringify(data)}`);
  fs.closeSync(fd);
}

function echoTest(portPath, message) {
  const fd = openPort(portPath);
  const buf = Buffer.alloc(4096);

  // Start reading
  console.log(`Listening on ${portPath}...`);
  const readInterval = setInterval(() => {
    try {
      const n = fs.readSync(fd, buf, 0, buf.length);
      if (n > 0) {
        process.stdout.write(buf.slice(0, n).toString("utf8"));
      }
    } catch (e) {
      if (e.code !== "EAGAIN" && e.code !== "EWOULDBLOCK") {
        // ignore
      }
    }
  }, 50);

  // Send after 1 second
  setTimeout(() => {
    const data = message + "\n";
    fs.writeSync(fd, data);
    console.log(`\n--- Sent: ${JSON.stringify(data)} ---`);
  }, 1000);

  // Stop after 5 seconds
  setTimeout(() => {
    clearInterval(readInterval);
    fs.closeSync(fd);
    console.log("\n--- done ---");
  }, 5000);
}

// CLI
const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case "list":
    listPorts();
    break;
  case "read":
    readPort(args[1], parseInt(args[2]) || 5000);
    break;
  case "send":
    sendMessage(args[1], args.slice(2).join(" "));
    break;
  case "echo":
    echoTest(args[1], args.slice(2).join(" "));
    break;
  default:
    console.log("Usage:");
    console.log("  node scripts/serial.js list");
    console.log("  node scripts/serial.js read /dev/cu.usbmodem...");
    console.log("  node scripts/serial.js send /dev/cu.usbmodem... message");
    console.log("  node scripts/serial.js echo /dev/cu.usbmodem... message");
    break;
}
