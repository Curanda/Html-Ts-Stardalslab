import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
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
