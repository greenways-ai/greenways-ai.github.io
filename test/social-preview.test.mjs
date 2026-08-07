import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  {
    path: "index.html",
    canonical: "https://oss.greenways.ai/",
    image:
      "https://oss.greenways.ai/visual-language/assets/og-greenways.jpg",
  },
  {
    path: "open-source/index.html",
    canonical: "https://oss.greenways.ai/open-source/",
    image:
      "https://oss.greenways.ai/visual-language/assets/og-greenways.jpg",
  },
  {
    path: "historian/index.html",
    canonical: "https://oss.greenways.ai/historia/",
    image:
      "https://oss.greenways.ai/visual-language/assets/og-historia.jpg",
  },
];

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)].map(
      ([, key, value]) => [key, value],
    ),
  );
}

function requireMeta(tags, attribute, name, content) {
  const matches = tags
    .map(attributes)
    .filter((attrs) => attrs[attribute] === name);
  assert.equal(matches.length, 1, `expected one ${attribute}=${name}`);
  assert.equal(matches[0].content, content, `${attribute}=${name}`);
}

for (const page of pages) {
  test(`${page.path} publishes one complete JPEG social preview`, async () => {
    const html = await readFile(page.path, "utf8");
    const head = html.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)?.[0];
    assert.ok(head, `${page.path} should have a complete head`);

    const tags = [...head.matchAll(/<meta\b[^>]*>/gi)].map(
      (match) => match[0],
    );
    requireMeta(tags, "property", "og:type", "website");
    requireMeta(tags, "property", "og:url", page.canonical);
    requireMeta(tags, "property", "og:image", page.image);
    requireMeta(tags, "property", "og:image:secure_url", page.image);
    requireMeta(tags, "property", "og:image:type", "image/jpeg");
    requireMeta(tags, "property", "og:image:width", "1200");
    requireMeta(tags, "property", "og:image:height", "630");
    requireMeta(tags, "name", "twitter:card", "summary_large_image");
    requireMeta(tags, "name", "twitter:image", page.image);

    const alt = tags
      .map(attributes)
      .find((attrs) => attrs.property === "og:image:alt")?.content;
    assert.ok(alt, "og:image:alt should be present");
    requireMeta(tags, "name", "twitter:image:alt", alt);

    const canonicals = [...head.matchAll(/<link\b[^>]*>/gi)]
      .map((match) => attributes(match[0]))
      .filter((attrs) => attrs.rel === "canonical");
    assert.deepEqual(canonicals, [{ rel: "canonical", href: page.canonical }]);

    assert.doesNotMatch(head, /visual-language\/assets\/og-[^"']+\.png/);
    assert.doesNotMatch(head, /opensource\.greenways\.ai/);
  });
}

test("the migration remains an explicit, repeatable repository command", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(
    pkg.scripts["fix:og"],
    "node scripts/apply-social-preview-contract.mjs",
  );
});
