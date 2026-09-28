#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const isWindows = process.platform === "win32";
const wrapper = isWindows ? "gradlew.bat" : "./gradlew";

const result = spawnSync(wrapper, process.argv.slice(2), {
  cwd: repoRoot,
  stdio: "inherit",
  shell: isWindows,
});

process.exit(result.status ?? 1);