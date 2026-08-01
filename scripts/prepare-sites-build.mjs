import { copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

if (process.argv.includes("--clean")) {
  await rm(dist, { force: true, recursive: true });
  process.exit(0);
}

const server = resolve(dist, "server");
await mkdir(server, { recursive: true });
await copyFile(resolve(root, "hosting/worker.mjs"), resolve(server, "index.js"));
