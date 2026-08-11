# Greenways Open Source

The Astro catalogue published at <https://oss.greenways.ai/>.

The public catalogue and shared project switcher contain exactly six projects:
Hestia, Hoplite, Historia, Hodos, Tahto, and Ignatius. The homepage keeps the
Greenways Open Source Charter beneath an immersive, keyboard-accessible project
selector.

## Development

```sh
npm install
npm run dev
npm test
```

`npm test` runs Astro diagnostics, builds the static site, creates its Pagefind
index, preserves the repository's governance/specification assets, and verifies
the generated output.

## Web 3D models and logo images

The full-resolution Pages copies of the GLB logos live in `assets/3d`. The canonical source archive is mirrored under `greenways-ai/workspace/assets/3d/source` through Git LFS. This repository keeps ordinary Git copies because GitHub Pages must be able to serve the files directly.

Generate consistently framed, transparent square logo images from every top-level GLB with Blender and `cwebp`:

```sh
# macOS
brew install --cask blender
brew install webp

npm run logos:render
npm run logos:check
```

The renderer writes 1600 × 1600 PNG and WebP files plus a source/output SHA-256 manifest to `assets/3d/renders`. Override the size, sample count, output directory, or input set with:

```sh
npm run logos:render -- assets/3d/hodos-3d-logo.glb --size 2048 --samples 96
```

`.github/workflows/render-logo-images.yml` reruns the renderer when a GLB or rendering contract changes and commits the updated derivatives to the source branch. Do not hand-edit files in `assets/3d/renders`.

Generate lightweight selector and detail GLB variants with:

```sh
npm run models:optimize -- assets/3d/greenways-3d-logo.glb
```

Generated model variants are written to `assets/3d/web`. Build only one preset or choose another output directory with:

```sh
npm run models:optimize -- path/to/model.glb --preset selector --output-dir path/to/output
```

Both presets use Meshopt geometry compression and WebP textures. Consumers must configure their glTF loader for `KHR_meshopt_compression`.

## Shared visual language

The site consumes `@greenways-ai/visual-language` directly for the canonical
documentation header, project switcher, search, theme control, typography, and
theme tokens. The dependency is pinned to an exact Git commit archive.

Project artwork and sigils use their canonical published URLs below
`https://oss.greenways.ai/visual-language/`, which also keeps standalone local
previews visually complete.

## Hosting

The production build is `dist/`. The GitHub Pages workflow publishes it from
`main`.
`CNAME`, the licence, governance documents, RFCs, and specifications are copied
into the build without moving their repository source paths.

Legacy `/open-source/` and `/historian/` routes remain as generated redirects.
