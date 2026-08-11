#!/usr/bin/env node

import { access, mkdir, stat } from "node:fs/promises";
import { dirname, extname, join, parse, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultInput = join(root, "assets/3d/greenways-3d-logo.glb");
const defaultOutputDirectory = join(root, "assets/3d/web");
const cli = join(root, "node_modules/@gltf-transform/cli/bin/cli.js");

const presets = {
  selector: {
    ratio: "0.08",
    error: "0.002",
    textureSize: "1024",
  },
  detail: {
    ratio: "0.25",
    error: "0.0005",
    textureSize: "2048",
  },
};

function usage() {
  console.log(`Usage: npm run models:optimize -- [input.glb] [options]

Options:
  --preset selector|detail|all  Build one preset or both (default: all)
  --output-dir <directory>      Output directory (default: assets/3d/web)
  --help                        Show this help

Presets:
  selector  Aggressive reduction for selection cards and initial loading
  detail    Higher-quality asset loaded after selection or interaction`);
}

function parseArguments(argv) {
  const options = {
    input: defaultInput,
    outputDirectory: defaultOutputDirectory,
    preset: "all",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      usage();
      process.exit(0);
    } else if (argument === "--preset") {
      options.preset = argv[++index];
    } else if (argument === "--output-dir") {
      options.outputDirectory = resolve(argv[++index]);
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (options.input === defaultInput) {
      options.input = resolve(argument);
    } else {
      throw new Error(`Unexpected argument: ${argument}`);
    }
  }

  if (!["selector", "detail", "all"].includes(options.preset)) {
    throw new Error(`Unknown preset: ${options.preset}`);
  }
  if (extname(options.input).toLowerCase() !== ".glb") {
    throw new Error("Input must be a .glb file.");
  }
  return options;
}

function run(command, arguments_) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`Optimizer exited with ${signal ?? `code ${code}`}.`));
    });
  });
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const options = parseArguments(process.argv.slice(2));
await access(options.input);
await access(cli);
await mkdir(options.outputDirectory, { recursive: true });

const selectedPresets = options.preset === "all"
  ? Object.entries(presets)
  : [[options.preset, presets[options.preset]]];
const sourceSize = (await stat(options.input)).size;
const sourceName = parse(options.input).name;

for (const [name, preset] of selectedPresets) {
  const output = join(options.outputDirectory, `${sourceName}-${name}.glb`);
  console.log(`\nBuilding ${name} model: ${output}`);
  await run(process.execPath, [
    cli,
    "optimize",
    options.input,
    output,
    "--compress", "meshopt",
    "--meshopt-level", "high",
    "--simplify", "true",
    "--simplify-ratio", preset.ratio,
    "--simplify-error", preset.error,
    "--texture-compress", "webp",
    "--texture-size", preset.textureSize,
  ]);

  const outputSize = (await stat(output)).size;
  const reduction = (100 * (1 - outputSize / sourceSize)).toFixed(1);
  console.log(`${name}: ${formatBytes(sourceSize)} -> ${formatBytes(outputSize)} (${reduction}% smaller)`);
}

