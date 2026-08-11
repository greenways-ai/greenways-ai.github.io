#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, join, parse, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultInputDirectory = join(root, "assets/3d");
const defaultOutputDirectory = join(defaultInputDirectory, "renders");
const blenderScript = join(root, "scripts/render-glb-logo.py");

function usage() {
  console.log(`Usage: npm run logos:render -- [input.glb ...] [options]

Renders every top-level assets/3d/*.glb file when no inputs are supplied.

Options:
  --output-dir <directory>  Output directory (default: assets/3d/renders)
  --size <pixels>           Square image size, 256-4096 (default: 1600)
  --samples <count>         Eevee render samples, 1-1024 (default: 64)
  --webp-quality <quality>  WebP quality, 1-100 (default: 90)
  --blender <command>       Blender executable (default: BLENDER_BIN or blender)
  --cwebp <command>         cwebp executable (default: CWEBP_BIN or cwebp)
  --png-only                Skip WebP generation
  --help                    Show this help`);
}

function positiveInteger(value, name, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return parsed;
}

function parseArguments(argv) {
  const options = {
    blender: process.env.BLENDER_BIN || "blender",
    cwebp: process.env.CWEBP_BIN || "cwebp",
    inputs: [],
    outputDirectory: defaultOutputDirectory,
    pngOnly: false,
    samples: 64,
    size: 1600,
    webpQuality: 90,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      usage();
      process.exit(0);
    } else if (argument === "--output-dir") {
      options.outputDirectory = resolve(argv[++index]);
    } else if (argument === "--size") {
      options.size = positiveInteger(argv[++index], "--size", 256, 4096);
    } else if (argument === "--samples") {
      options.samples = positiveInteger(argv[++index], "--samples", 1, 1024);
    } else if (argument === "--webp-quality") {
      options.webpQuality = positiveInteger(argv[++index], "--webp-quality", 1, 100);
    } else if (argument === "--blender") {
      options.blender = argv[++index];
    } else if (argument === "--cwebp") {
      options.cwebp = argv[++index];
    } else if (argument === "--png-only") {
      options.pngOnly = true;
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      options.inputs.push(resolve(argument));
    }
  }

  return options;
}

function run(command, arguments_, { capture = false } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, {
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }
    child.on("error", (error) => {
      reject(new Error(`Could not run ${command}: ${error.message}`));
    });
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
      } else {
        const suffix = capture && stderr.trim() ? `\n${stderr.trim()}` : "";
        reject(new Error(`${command} exited with ${signal ?? `code ${code}`}.${suffix}`));
      }
    });
  });
}

async function sha256(path) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolvePromise(hash.digest("hex")));
  });
}

function repositoryPath(path) {
  return relative(root, path).split(sep).join("/");
}

async function discoverInputs(explicitInputs) {
  if (explicitInputs.length > 0) return explicitInputs;
  const entries = await readdir(defaultInputDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".glb")
    .map((entry) => join(defaultInputDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

const options = parseArguments(process.argv.slice(2));
const inputs = await discoverInputs(options.inputs);
if (inputs.length === 0) {
  throw new Error("No .glb logo sources were found.");
}
for (const input of inputs) {
  await access(input);
  if (extname(input).toLowerCase() !== ".glb") {
    throw new Error(`Input must be a .glb file: ${input}`);
  }
}
await access(blenderScript);
await mkdir(options.outputDirectory, { recursive: true });
for (const entry of await readdir(options.outputDirectory, { withFileTypes: true })) {
  if (entry.isFile() && (entry.name === "manifest.json" || /\.(?:png|webp)$/i.test(entry.name))) {
    await unlink(join(options.outputDirectory, entry.name));
  }
}

const blenderVersion = (await run(options.blender, ["--version"], { capture: true }))
  .stdout.split("\n")[0].trim();
if (!options.pngOnly) {
  await run(options.cwebp, ["-version"], { capture: true });
}

const assets = [];
for (const input of inputs) {
  const name = parse(input).name;
  const png = join(options.outputDirectory, `${name}.png`);
  const webp = join(options.outputDirectory, `${name}.webp`);
  console.log(`\nRendering ${repositoryPath(input)}`);
  await run(options.blender, [
    "--background",
    "--factory-startup",
    "--python", blenderScript,
    "--",
    "--input", input,
    "--output", png,
    "--size", String(options.size),
    "--samples", String(options.samples),
  ]);

  if (!options.pngOnly) {
    await run(options.cwebp, [
      "-quiet",
      "-mt",
      "-m", "6",
      "-q", String(options.webpQuality),
      "-alpha_q", "100",
      "-exact",
      png,
      "-o", webp,
    ]);
  }

  const sourceInfo = await stat(input);
  const pngInfo = await stat(png);
  const entry = {
    source: repositoryPath(input),
    sourceBytes: sourceInfo.size,
    sourceSha256: await sha256(input),
    png: repositoryPath(png),
    pngBytes: pngInfo.size,
    pngSha256: await sha256(png),
  };
  if (!options.pngOnly) {
    const webpInfo = await stat(webp);
    Object.assign(entry, {
      webp: repositoryPath(webp),
      webpBytes: webpInfo.size,
      webpSha256: await sha256(webp),
    });
  }
  assets.push(entry);
}

const manifest = {
  protocol: "greenways.logo-render-manifest/1",
  renderer: {
    blender: blenderVersion,
    cameraPreset: "isometric-front/v1",
    samples: options.samples,
    size: options.size,
    transparent: true,
    webpQuality: options.pngOnly ? null : options.webpQuality,
  },
  assets,
};
await writeFile(
  join(options.outputDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(`\nWrote ${repositoryPath(join(options.outputDirectory, "manifest.json"))}`);
