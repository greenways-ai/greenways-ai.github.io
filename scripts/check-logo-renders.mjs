#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "assets/3d/renders/manifest.json");

async function sha256(path) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolvePromise(hash.digest("hex")));
  });
}

async function verifyFile(path, expectedBytes, expectedHash, label) {
  await access(path);
  const info = await stat(path);
  if (info.size !== expectedBytes) {
    throw new Error(`${label} size mismatch: expected ${expectedBytes}, found ${info.size}`);
  }
  const actualHash = await sha256(path);
  if (actualHash !== expectedHash) {
    throw new Error(`${label} SHA-256 mismatch: expected ${expectedHash}, found ${actualHash}`);
  }
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
if (manifest.protocol !== "greenways.logo-render-manifest/1") {
  throw new Error(`Unsupported logo render manifest: ${manifest.protocol ?? "missing"}`);
}
if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
  throw new Error("The logo render manifest contains no assets.");
}

const seenSources = new Set();
for (const asset of manifest.assets) {
  if (seenSources.has(asset.source)) {
    throw new Error(`Duplicate logo source in manifest: ${asset.source}`);
  }
  seenSources.add(asset.source);
  await verifyFile(
    join(root, asset.source),
    asset.sourceBytes,
    asset.sourceSha256,
    `source ${asset.source}`,
  );
  await verifyFile(
    join(root, asset.png),
    asset.pngBytes,
    asset.pngSha256,
    `PNG ${asset.png}`,
  );
  if (asset.webp) {
    await verifyFile(
      join(root, asset.webp),
      asset.webpBytes,
      asset.webpSha256,
      `WebP ${asset.webp}`,
    );
  }
}

console.log(`Verified ${manifest.assets.length} GLB logo render set(s).`);
