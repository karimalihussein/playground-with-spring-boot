import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build drops assets into Spring static resources; dev server proxies to Boot on 8080.
export default defineConfig({
  plugins: [react()],
  base: "/protocol-lab/",
  build: {
    outDir: "../src/main/resources/static/protocol-lab",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/rest": "http://localhost:8080",
      "/demo": "http://localhost:8080",
    },
  },
});
