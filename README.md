# Greenways company site

Static GitHub Pages site for `greenways.ai`.

## Site structure

- `/` — company homepage
- `/papers/` — research and papers library
- `/papers/<slug>/` — browser-readable paper pages
- `/spaces/` — compatibility redirect to `https://spaces.greenways.ai`

The visual system deliberately carries forward the existing Greenways product language: teal and slate colours, rounded cards, soft borders, generous spacing and system/network motifs.

## Publishing a paper

1. Create a folder under `papers/`, for example `papers/my-paper/`.
2. Add the browser version as `papers/my-paper/index.html`.
3. Optionally add a PDF in the same folder, for example `papers/my-paper/my-paper.pdf`.
4. Add the paper to `papers/index.html`.
5. Use an absolute site path for internal assets, such as `/styles.css`.
6. Open a pull request and preview the rendered page before merging.

A paper page can be copied from `papers/research-programme/index.html` as a starting point.

## Domain handover

The company site and Greenways Spaces should be treated as separate deployments.

### Target arrangement

| Host | Purpose | Deployment |
|---|---|---|
| `greenways.ai` | Greenways company and research site | This GitHub Pages repository |
| `spaces.greenways.ai` | Existing Greenways Spaces product page/application | The current product source repository and hosting provider |
| `statstrade.io` | Statstrade product | Existing Statstrade deployment |

### Safe cutover order

1. Identify the repository and hosting project currently serving the product page at `greenways.ai`.
2. Add `spaces.greenways.ai` as a custom domain on that existing product deployment.
3. Add the DNS record requested by that hosting provider, usually a `CNAME` for `spaces`.
4. Confirm `https://spaces.greenways.ai` loads correctly and has a valid TLS certificate.
5. Configure GitHub Pages for this repository from the `main` branch at `/ (root)`.
6. Set the GitHub Pages custom domain to `greenways.ai`. The tracked `CNAME` file already contains this value.
7. Point the apex domain records for `greenways.ai` to GitHub Pages as instructed in the repository Pages settings.
8. Confirm `https://greenways.ai`, `https://greenways.ai/papers/` and `https://spaces.greenways.ai` all work before removing the old apex domain from the product deployment.

Do not point `spaces.greenways.ai` at this repository. It must point at the product deployment; otherwise the subdomain would serve the company site rather than the Spaces application.

## Local preview

From the repository root:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Content notes

- Replace `hello@greenways.ai` if a different public contact address is preferred.
- The first paper is explicitly labelled as a programme note and living document.
- The two “Publishing next” paper entries are placeholders and can be removed or replaced before launch.
