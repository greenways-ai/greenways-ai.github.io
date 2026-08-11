import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the catalogue exposes exactly the six canonical OSS projects", async () => {
  const source = await read("src/components/ProjectSelector.astro");
  for (const name of ["Hestia", "Hoplite", "Historia", "Hodos", "Tahto", "Ignatius"]) assert.match(source, new RegExp(`name: "${name}"`));
  for (const excluded of ["Hara", "Greenways OS", "Visual Language", "Statstrade"]) assert.doesNotMatch(source, new RegExp(`name: "${excluded}"`));
  assert.match(source, /01 \/ 06/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowRight/);
});

test("the built homepage has the shared header, Charter, and metadata", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /data-gw-documentation-header/);
  assert.match(html, /Search Greenways Open Source/);
  assert.match(html, /Open Source Charter/);
  assert.match(html, /og-greenways\.jpg/);
  assert.doesNotMatch(html, /og-greenways\.png/);
  for (const project of ["hestia", "hoplite", "historia", "hodos", "tahto", "ignatius"]) assert.match(html, new RegExp(`data-project="${project}"`));
});

test("the build preserves repository assets and compatibility routes", async () => {
  for (const path of ["dist/CNAME", "dist/LICENSE", "dist/specs/README.md", "dist/rfcs/README.md", "dist/governance/STANDARDS_PROCESS.md", "dist/open-source/index.html", "dist/historian/index.html"]) assert.ok((await read(path)).length > 0, path);
});
