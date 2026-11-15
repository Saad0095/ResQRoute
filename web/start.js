import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, "node_modules", "vite", "bin", "vite.js");

const args = process.argv.slice(2);
process.argv = [process.argv[0], cliPath, ...args];

await import(pathToFileURL(cliPath).href);
