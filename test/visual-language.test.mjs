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

test("vendored visual-language primitives match the pinned release", async () => {
  for (const [path, expected] of Object.entries(lock.files)) {
    assert.equal(
      gitBlobSha(await read(path)),
      expected,
      `${path} drifted from ${lock.repository}@${lock.commit}`,
    );
  }
});

test("the document declares the Greenways project and all three theme states", async () => {
  const html = await read("index.html");
  assert.match(html, /data-project="greenways"/);
  assert.match(html, /data-theme-preference="auto"/);
  assert.match(
    html,
    new RegExp(`data-visual-language="${lock.version.replaceAll(".", "\\.")}"`),
  );
  for (const theme of ["auto", "light", "dark"]) {
    assert.match(html, new RegExp(`data-theme-choice="${theme}"`));
  }
  assert.match(html, /assets\/theme\.css/);
  assert.match(html, /assets\/theme\.js/);
});

test("the catalogue includes every published Greenways foundation", async () => {
  const html = await read("index.html");
  assert.match(html, /Five foundations\./);
  for (const project of ["hestia", "hoplite", "historia", "hodos", "visual-language"]) {
    assert.match(
      html,
      new RegExp(`href="\\./${project}/"`),
      `${project} is missing from navigation`,
    );
    assert.match(
      html,
      new RegExp(`data-project-card="${project}"`),
      `${project} is missing from the collection`,
    );
  }
});

test("the header uses the canonical v4 voronoi Greenways sigil", async () => {
  const html = await read("index.html");
  assert.match(html, /<img class="gw-sigil" src="\.\/sigil\.svg" alt="Greenways sigil"/);
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
});

test("hero artwork uses the shared adaptive artwork primitive", async () => {
  const html = await read("index.html");
  const css = await read("styles.css");
  assert.match(html, /hero-art gw-themed-artwork/);
  assert.match(css, /--gw-art-light:\s*url\("\.\/assets\/greenways-day\.webp"\)/);
  assert.match(css, /--gw-art-dark:\s*url\("\.\/assets\/greenways-night\.webp"\)/);
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

test("project-card labels meet WCAG AA in both themes", () => {
  for (const foreground of ["#8e2731", "#765b15", "#426fa6", "#1d5e4d", "#0b6b4f"]) {
    assert.ok(contrast(foreground, "#fbfaf6") >= 4.5, `${foreground} on light surface`);
  }
  for (const foreground of ["#dc4b40", "#d7b64e", "#5b86b8", "#70c99a", "#33a878"]) {
    assert.ok(contrast(foreground, "#0b1410") >= 4.5, `${foreground} on dark surface`);
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

test("keyboard and reduced-motion affordances stay present", async () => {
  const html = await read("index.html");
  const css = `${await read("assets/theme.css")}\n${await read("styles.css")}`;
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-label="Choose appearance"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
