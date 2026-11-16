#!/usr/bin/env node
import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const base = "/opt/cursor/artifacts/int-bootstrap";
const files = ["schema.sql", "seed.sql", "manifest.json"];

console.log("[Package INT Bootstrap]");

const checksums = {};
for (const f of files) {
  const path = `${base}/${f}`;
  const bytes = readFileSync(path);
  const hash = createHash("sha256").update(bytes).digest("hex");
  checksums[f] = hash;
  console.log(`  ${f}: ${hash}`);
}

writeFileSync(`${base}/checksums.txt`, 
  Object.entries(checksums).map(([f, h]) => `${h}  ${f}`).join("\n") + "\n"
);

execSync(`cd ${base} && zip -q int-bootstrap.zip ${files.join(" ")} checksums.txt`);

const zipBytes = readFileSync(`${base}/int-bootstrap.zip`);
const zipHash = createHash("sha256").update(zipBytes).digest("hex");

console.log(`\n✓ ${base}/int-bootstrap.zip`);
console.log(`  SHA256: ${zipHash}`);
console.log(`  Size: ${(zipBytes.length / 1024).toFixed(1)} KB`);
