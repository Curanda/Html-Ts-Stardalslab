import { defineConfig } from "vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) {
            return "three-vendor";
          }

          if (id.includes("node_modules/chroma-js")) {
            return "color-vendor";
          }
        },
      },
    },
  },
});