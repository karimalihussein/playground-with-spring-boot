import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** Single fat client: output replaces `backend/src/main/resources/static` root (preserve files via `public/`). */
export default defineConfig({
  plugins: [react()],
  base: "/",
  publicDir: "public",
  build: {
    outDir: "../backend/src/main/resources/static",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/rest": "http://localhost:8080",
      "/demo": "http://localhost:8080",
    },
  },
});
