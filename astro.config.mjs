import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://oss.greenways.ai",
  output: "static",
  build: { format: "directory" },
  vite: { build: { assetsInlineLimit: 0 } },
});
