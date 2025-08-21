#!/usr/bin/env node
"use strict";

// Simple CLI to print a greeting message.
const args = process.argv.slice(2);
let message = "Hello, Constellation!";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--message" && i + 1 < args.length) {
    message = args[i + 1];
    i++;
  } else if (arg.startsWith("--message=")) {
    message = arg.split("=")[1];
  }
}

console.log(message);
