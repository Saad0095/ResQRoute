#!/usr/bin/env node
const path = require("path");

// Bypass Windows cmd.exe & character issue by invoking Expo directly through Node
const cliPath = path.resolve(__dirname, "node_modules", "@expo", "cli", "build", "bin", "cli");
const args = process.argv.slice(2);
process.argv = [process.argv[0], cliPath, args.length > 0 ? args[0] : "start", ...args.slice(1)];

require(cliPath);
