# Greenways Open Source

The static catalogue published at <https://opensource.greenways.ai/>.

- Production: `https://opensource.greenways.ai/`
- Hosting: GitHub Pages from the default branch, with the custom domain recorded in `CNAME`
- Build: none; the repository is published directly

## Visual language contract

This site consumes the shared `greenways-ai/visual-language` system rather than maintaining an independent brand theme.

The pinned release is recorded in `visual-language.lock.json`. The following files are exact vendored copies from that release:

- `assets/theme.css` from `src/theme.css`
- `assets/theme.js` from `src/theme.js`
- `sigil.svg` from `assets/favicons/greenways.svg`

Page-specific CSS may consume `--gw-*` tokens, but it must not redefine the protected canvas, surface, text, line, control, artwork, or sigil tokens. The header uses the canonical piece-cut glass Greenways sigil, and themed imagery uses the shared `gw-themed-artwork` primitive.

Run the integrity suite before publishing:

```sh
npm test
```

The same suite runs on pull requests and pushes to `main` through `.github/workflows/visual-language.yml`. It verifies the pinned upstream blobs, adaptive light/dark/automatic modes, the piece-cut glass mark, complete project navigation, token scoping, accessible contrast, reduced-motion support, and the absence of legacy mark dimensions.

## Updating the visual language

1. Choose a tested `greenways-ai/visual-language` release or commit.
2. Copy the canonical theme CSS, theme JavaScript, and Greenways favicon into this repository.
3. Update the version, commit, and Git blob hashes in `visual-language.lock.json`.
4. Update any shared static markup that changed, such as the sigil or theme menu.
5. Run `npm test` and review both light and dark rendering before merging.
