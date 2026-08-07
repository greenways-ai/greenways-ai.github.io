import { readFile, writeFile } from "node:fs/promises";

const pages = [
  {
    path: "index.html",
    canonical: "https://oss.greenways.ai/",
    title: "Greenways Open Source",
    description:
      "Durable public tools, standards, and infrastructure for anyone building on the web.",
    image:
      "https://oss.greenways.ai/visual-language/assets/og-greenways.jpg",
    imageAlt: "Greenways Open Source — public tools and shared infrastructure",
  },
  {
    path: "open-source/index.html",
    canonical: "https://oss.greenways.ai/open-source/",
    title: "Greenways Open Source Charter",
    description: "The commitments behind every Greenways Open Source Project.",
    image:
      "https://oss.greenways.ai/visual-language/assets/og-greenways.jpg",
    imageAlt: "The Greenways open-source forum and its shared mosaic foundations",
  },
  {
    path: "historian/index.html",
    canonical: "https://oss.greenways.ai/historia/",
    title: "Historia",
    description:
      "Git-native memory, symbol lineage, and a raven watching the archive.",
    image:
      "https://oss.greenways.ai/visual-language/assets/og-historia.jpg",
    imageAlt: "Historia's raven sigil over the illuminated archive",
  },
];

const managedMeta = [
  "og:type",
  "og:title",
  "og:description",
  "og:url",
  "og:image",
  "og:image:secure_url",
  "og:image:type",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
  "twitter:image:alt",
];

const escapePattern = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const managedPattern = managedMeta.map(escapePattern).join("|");
const managedMetaTag = new RegExp(
  `<meta\\b(?=[^>]*(?:property|name)\\s*=\\s*["'](?:${managedPattern})["'])[^>]*>\\s*`,
  "gi",
);
const canonicalLink =
  /<link\b(?=[^>]*rel\s*=\s*["']canonical["'])[^>]*>\s*/gi;

const escapeAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

function metadataBlock(page) {
  const a = Object.fromEntries(
    Object.entries(page).map(([key, value]) => [key, escapeAttribute(value)]),
  );

  return `    <link rel="canonical" href="${a.canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${a.title}" />
    <meta property="og:description" content="${a.description}" />
    <meta property="og:url" content="${a.canonical}" />
    <meta property="og:image" content="${a.image}" />
    <meta property="og:image:secure_url" content="${a.image}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${a.imageAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${a.title}" />
    <meta name="twitter:description" content="${a.description}" />
    <meta name="twitter:image" content="${a.image}" />
    <meta name="twitter:image:alt" content="${a.imageAlt}" />`;
}

for (const page of pages) {
  const source = await readFile(page.path, "utf8");
  const headMatch = source.match(/<head\b[^>]*>[\s\S]*?<\/head>/i);
  if (!headMatch) throw new Error(`${page.path} has no complete <head>`);

  const cleanedHead = headMatch[0]
    .replace(managedMetaTag, "")
    .replace(canonicalLink, "")
    .replace(/\n[ \t]+\n/g, "\n");
  const nextHead = cleanedHead.replace(
    /\s*<\/head>$/i,
    `\n${metadataBlock(page)}\n  </head>`,
  );
  const output = source.replace(headMatch[0], nextHead);

  await writeFile(page.path, output);
  console.log(`updated ${page.path}`);
}
