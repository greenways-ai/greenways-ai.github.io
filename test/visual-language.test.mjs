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

test("vendored visual-language primitives match the pinned release", async () => {
  for (const [path, expected] of Object.entries(lock.files)) {
    assert.equal(gitBlobSha(await read(path)), expected, `${path} drifted`);
  }
});

test("the root document retains adaptive Greenways theme state", async () => {
  const html = await read("index.html");
  assert.match(html, /data-project="greenways"/);
  assert.match(html, /data-theme-preference="auto"/);
  assert.match(
    html,
    new RegExp(`data-visual-language="${lock.version.replaceAll(".", "\\.")}"`),
  );
  assert.match(html, /assets\/theme\.css/);
  assert.match(html, /assets\/theme\.js/);
  assert.match(html, /data-theme-menu/);
});

test("the shared header is charter-only and has no GitHub or sites menu", async () => {
  const html = await read("index.html");
  assert.equal((html.match(/class="gw-header"/g) || []).length, 1);
  assert.match(html, /class="gw-header__desktop charter-menu"/);
  assert.match(html, /class="gw-search-trigger"/);
  assert.match(html, /<kbd>⌘ K<\/kbd>/);
  assert.match(html, /class="gw-theme-menu"/);
  assert.match(html, /class="gw-control gw-menu-trigger"/);
  for (const [label, href] of [
    ["Top", "#top"],
    ["01 · Open by default", "#open-by-default"],
    ["02 · Usable freedom", "#usable-freedom"],
    ["03 · Public stewardship", "#public-stewardship"],
    ["04 · Interoperability", "#interoperability"],
    ["05 · Contributors", "#contributors"],
    ["06 · Sustainability", "#sustainability"],
    ["07 · Identity", "#identity"],
  ]) {
    assert.match(html, new RegExp(`>${label}<`));
    assert.ok((html.match(new RegExp(`href="${href}"`, "g")) || []).length >= 2);
  }
  assert.doesNotMatch(html, /gw-project-menu|<summary>Sites<\/summary>|>GitHub ↗<\/a>/);
});

test("the hero is a seven-project 3D selector", async () => {
  const [html, script, css] = await Promise.all([
    read("index.html"),
    read("script.js"),
    read("selector.css"),
  ]);
  const heroStart = html.indexOf('id="top"');
  const launcherStart = html.indexOf('id="projects"');
  const charterStart = html.indexOf('id="charter"');
  assert.ok(heroStart >= 0 && launcherStart > heroStart && charterStart > launcherStart);
  assert.match(html, /<h1>Open Source<\/h1>/);
  assert.match(html, /hero__copy hero__copy--compact/);
  assert.match(html, /data-active-sigil/);
  assert.match(html, /class="project-stage"/);
  assert.equal((html.match(/data-project-select/g) || []).length, 7);
  assert.equal((html.match(/data-hero-art/g) || []).length, 3);
  assert.match(script, /const activateProject/);
  assert.match(script, /applyBackground/);
  assert.match(script, /ArrowLeft/);
  assert.match(script, /ArrowRight/);
  assert.match(css, /perspective:\s*1500px/);
  assert.match(css, /selected-sigil-float/);
  assert.match(css, /project-choice__pedestal/);
});

test("all projects use current canonical sigils and mapped world art", async () => {
  const html = await read("index.html");
  for (const project of ["hestia", "hoplite", "historia", "hodos", "greenways", "visual-language"]) {
    assert.match(html, new RegExp(`/visual-language/favicons/${project}\\.svg\\?v=4\\.8\\.0`));
  }
  for (const name of ["Hara", "Hestia", "Hoplite", "Historia", "Hodos", "Greenways OS", "Visual Language"]) {
    assert.match(html, new RegExp(`class="app-name">${name}<`));
  }
  for (const scene of [
    "iridescent-observatory",
    "sovereign-hearth",
    "open-gate",
    "raven-library",
    "moth-theatre",
    "world-confluence",
    "lotus-river-delta",
  ]) {
    assert.match(html, new RegExp(`${scene}-day\\.webp`));
    assert.match(html, new RegExp(`${scene}-night\\.webp`));
  }
});

test("the small introduction and charter ordering remain explicit", async () => {
  const [html, css] = await Promise.all([read("index.html"), read("selector.css")]);
  assert.match(css, /hero__copy--compact h1[\s\S]*font-size:\s*clamp\(1\.75rem/);
  assert.match(css, /hero__copy\.hero__copy--compact > p:last-child[\s\S]*font-size:\s*0\.74rem/);
  assert.match(html, /01 · Open Source Charter · 1\.0/);
  assert.match(html, /Greenways builds durable tools in public\./);
  for (const section of [
    "OPEN BY DEFAULT",
    "USABLE FREEDOM",
    "PUBLIC STEWARDSHIP",
    "INTEROPERABILITY",
    "CONTRIBUTORS",
    "SUSTAINABILITY",
    "IDENTITY",
  ]) assert.match(html, new RegExp(section));
});

test("canonical root and historian marks remain adaptive Voronoi assets", async () => {
  const html = await read("index.html");
  assert.match(html, /<img class="gw-sigil" src="\.\/sigil\.svg"/);
  assert.match(html, /<link rel="icon" href="\.\/favicon\.svg"/);
  for (const path of ["sigil.svg", "favicon.svg", "historian/sigil.svg", "historian/favicon.svg"]) {
    const svg = await read(path);
    assert.match(svg, /viewBox="0 0 480 480"/);
    assert.doesNotMatch(svg, /--grout|<pattern id="mosaic"/);
  }
  assert.match(await read("sigil.svg"), /prefers-color-scheme:\s*dark/);
});

test("page styles consume rather than redefine protected theme tokens", async () => {
  const css = `${await read("styles.css")}\n${await read("selector.css")}`;
  for (const token of [
    "canvas", "surface", "surface-muted", "text", "text-muted", "line",
    "line-strong", "verdigris", "gold", "terracotta", "silver", "focus",
    "header", "control-bg", "control-text", "control-hover", "art-veil",
    "sigil-ground", "sigil-grout",
  ]) {
    assert.doesNotMatch(css, new RegExp(`--gw-${token}\\s*:`), token);
  }
  assert.match(css, /background:\s*var\(--gw-canvas\)/);
  assert.doesNotMatch(css, /#030504|#0b100e|#111815/i);
});

test("legacy mark dimensions and inaccessible motion regressions stay absent", async () => {
  for (const file of await walk(rootPath)) {
    if (!/\.(css|html|js|mjs|svg)$/.test(file)) continue;
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(
      source,
      /repeat\((?:9|10|20)\s*,\s*1fr\)|viewBox=["']0 0 (?:9|10|20) (?:9|10|20)["']|(?:9|10|20)×(?:9|10|20)/i,
      file,
    );
  }
  const html = await read("index.html");
  const css = `${await read("assets/theme.css")}\n${await read("styles.css")}\n${await read("selector.css")}`;
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-label="Choose appearance"/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
