import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  base: process.env.GITHUB_PAGES === "true" ? "/electrolyte-compass/" : "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
