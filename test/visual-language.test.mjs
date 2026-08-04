import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const read = (path) => readFile(new URL(path, root), "utf8");
const lock = JSON.parse(await read("visual-language.lock.json"));

function gitBlobSha(source) {
  const bytes = Buffer.from(source);
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => ![".git", "node_modules"].includes(entry.name))
      .map(async (entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
      }),
  );
  return files.flat();
}

function luminance(hex) {
  const channels = hex
    .match(/[\da-f]{2}/gi)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

test("vendored visual-language primitives match the pinned release", async () => {
  for (const [path, expected] of Object.entries(lock.files)) {
    assert.equal(
      gitBlobSha(await read(path)),
      expected,
      `${path} drifted from ${lock.repository}@${lock.commit}`,
    );
  }
});

test("the document declares Greenways and a direct light-dark theme control", async () => {
  const html = await read("index.html");
  assert.match(html, /data-project="greenways"/);
  assert.match(html, /data-theme-preference="auto"/);
  assert.match(
    html,
    new RegExp(`data-visual-language="${lock.version.replaceAll(".", "\\.")}"`),
  );
  assert.match(html, /data-theme-toggle/);
  assert.match(html, /aria-label="Switch to dark theme"/);
  assert.doesNotMatch(html, /data-theme-choice=/);
  assert.match(html, /assets\/theme\.css/);
  assert.match(html, /assets\/theme\.js/);
});

test("the homepage is builder-first and organised around connected worlds", async () => {
  const html = await read("index.html");
  assert.match(html, /<h1>Anyone can build a world\.<\/h1>/);
  assert.match(html, /id="worlds"/);
  assert.match(html, /id="studio"/);
  assert.match(html, /id="standards"/);
  assert.match(html, /BUILD CONNECTED WORLDS/);
  assert.match(html, /STUDIO WIDGETS/);
  assert.match(html, /OPEN STANDARDS/);
  assert.match(html, /We are big in open source\./);
  assert.match(html, /href="https:\/\/oss\.greenways\.ai\/"/);
  assert.doesNotMatch(
    html,
    /Five foundations|One atelier|Many forms|Luxurious worlds|THE CELESTIAL WORLD|data-project-card/,
  );
});

test("the header uses the canonical v4 voronoi Greenways sigil", async () => {
  const html = await read("index.html");
  assert.match(html, /<img class="gw-sigil" src="\.\/sigil\.svg" alt=""/);
  assert.match(html, /<link rel="icon" href="\.\/favicon\.svg"/);
  assert.doesNotMatch(html, /gw-sigil--greenways|gw-greenways-tessera|gw-sigil__tessera|gw-glass/);
  assert.match(html, /content="https:\/\/oss\.greenways\.ai\/visual-language\/assets\/og-greenways\.png"/);
  assert.match(html, /twitter:card" content="summary_large_image"/);

  const sigil = await read("sigil.svg");
  assert.match(sigil, /viewBox="0 0 480 480"/);
  assert.match(sigil, /prefers-color-scheme:\s*dark/);
  assert.match(sigil, /--g00:/);
  assert.doesNotMatch(sigil, /--grout|<pattern id="mosaic"/);

  const favicon = await read("favicon.svg");
  assert.match(favicon, /viewBox="0 0 480 480"/);
  assert.match(favicon, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(favicon, /--grout|<pattern id="mosaic"/);
});

test("the historian redirect page carries the v4 historian sigil and og card", async () => {
  const html = await read("historian/index.html");
  assert.match(html, /<link rel="icon" href="\.\/favicon\.svg"/);
  assert.match(html, /content="https:\/\/oss\.greenways\.ai\/visual-language\/assets\/og-historia\.png"/);
  const sigil = await read("historian/sigil.svg");
  assert.match(sigil, /viewBox="0 0 480 480"/);
  assert.match(sigil, /prefers-color-scheme:\s*dark/);
  assert.doesNotMatch(sigil, /--grout|<pattern id="mosaic"/);
  const favicon = await read("historian/favicon.svg");
  assert.match(favicon, /viewBox="0 0 480 480"/);
  assert.doesNotMatch(favicon, /--grout|<pattern id="mosaic"/);
});

test("page styles consume tokens without redefining the shared theme", async () => {
  const css = await read("styles.css");
  const protectedTokens = [
    "canvas",
    "surface",
    "surface-muted",
    "text",
    "text-muted",
    "line",
    "line-strong",
    "verdigris",
    "gold",
    "terracotta",
    "silver",
    "focus",
    "header",
    "control-bg",
    "control-text",
    "control-hover",
    "art-veil",
    "sigil-ground",
    "sigil-grout",
  ];
  for (const token of protectedTokens) {
    assert.doesNotMatch(
      css,
      new RegExp(`--gw-${token}\\s*:`),
      `styles.css must not redefine --gw-${token}`,
    );
  }
  assert.doesNotMatch(css, /#030504|#0b100e|#111815/i, "legacy forced-black palette returned");
  assert.match(css, /background:\s*var\(--gw-canvas\)/);
  assert.doesNotMatch(css, /color:\s*var\(--gw-gold\)/);
});

test("the world carousel begins with Celestial Promenade and uses adaptive artwork", async () => {
  const html = await read("index.html");
  assert.equal(countMatches(html, /data-world-slide/g), 5);
  assert.equal(countMatches(html, /world-slide__art gw-themed-artwork/g), 5);
  assert.match(
    html,
    /class="world-slide is-active"[\s\S]*?data-title="Celestial Promenade"/,
  );
  for (const asset of [
    "celestial-promenade-day.webp",
    "celestial-promenade-night.webp",
    "celestial-promenade-day-mobile.webp",
    "celestial-promenade-night-mobile.webp",
    "peacock-garden-day.webp",
    "peacock-garden-night.webp",
    "world-confluence-day.webp",
    "world-confluence-night.webp",
  ]) {
    assert.match(html, new RegExp(asset.replaceAll(".", "\\.")));
  }
});

test("essential canonical foreground/background pairs meet WCAG AA", () => {
  for (const [foreground, background] of [
    ["#101612", "#f4f2ec"],
    ["#101612", "#fbfaf6"],
    ["#58615c", "#fbfaf6"],
    ["#f7f5ef", "#050a08"],
    ["#f7f5ef", "#0b1410"],
    ["#adb5af", "#0b1410"],
  ]) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  }
});

test("the aquamarine and cyan presentation keeps essential text contrast", async () => {
  const css = await read("styles.css");
  assert.match(css, /--gw-aqua:\s*#087b68/);
  assert.match(css, /--gw-cyan:\s*#23bde2/);
  assert.match(css, /--gw-peacock-violet:\s*#5d4b9a/);

  for (const [foreground, background] of [
    ["#087b68", "#f4f2ec"],
    ["#24c8a7", "#050a08"],
    ["#a6eef4", "#062628"],
    ["#b9f5f8", "#062628"],
    ["#031b1a", "#18c9ae"],
    ["#031b1a", "#23bde2"],
  ]) {
    assert.ok(contrast(foreground, background) >= 4.5, `${foreground} on ${background}`);
  }
});

test("legacy mark dimensions are absent", async () => {
  for (const file of await walk(rootPath)) {
    if (!/\.(css|html|js|mjs|svg)$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(
      source,
      /repeat\((?:9|10|20)\s*,\s*1fr\)|viewBox=["']0 0 (?:9|10|20) (?:9|10|20)["']|(?:nine|ten|twenty) by (?:nine|ten|twenty)|(?:9|10|20)×(?:9|10|20)/i,
      `${file} contains a legacy visual mark`,
    );
  }
});

test("keyboard, carousel and reduced-motion affordances stay present", async () => {
  const html = await read("index.html");
  const script = await read("script.js");
  const css = `${await read("assets/theme.css")}\n${await read("styles.css")}`;
  assert.match(html, /class="skip-link"/);
  assert.match(html, /data-theme-toggle/);
  assert.match(html, /aria-label="Show previous world"/);
  assert.match(html, /aria-label="Show next world"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(script, /ArrowLeft/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
