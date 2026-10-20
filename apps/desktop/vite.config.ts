import { defineConfig } from "vite";

// Tauri käivitab arendusserveri pordil 1420 ja ootab, et port ei muutuks.
export default defineConfig({
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    target: "chrome110",
    outDir: "dist",
    emptyOutDir: true,
  },
  optimizeDeps: {
    // Core on TypeScripti lähtekood, mida ei ole vaja eelpakendada.
    exclude: ["@kiirmarge/core"],
  },
});