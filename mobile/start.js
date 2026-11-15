#!/usr/bin/env node
const path = require("path");
const fs = require("fs");

// Ensure execution directory is the mobile directory
process.chdir(__dirname);

// Bypass Windows cmd.exe & character issue by invoking Expo directly through Node
let cliPath = path.resolve(__dirname, "node_modules", "@expo", "cli", "bin", "cli.js");
if (!fs.existsSync(cliPath)) {
  cliPath = path.resolve(__dirname, "node_modules", "@expo", "cli", "build", "bin", "cli");
}
const args = process.argv.slice(2);
const command = args[0] || "start";
const otherArgs = args.slice(1);
if (command === "start" && !args.includes("-c") && !args.includes("--clear")) {
  otherArgs.unshift("-c");
}
process.argv = [process.argv[0], cliPath, command, ...otherArgs];

require(cliPath);
