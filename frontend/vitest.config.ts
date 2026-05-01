import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    alias: {
      "@backend": path.resolve(__dirname, "../backend"),
      "@": path.resolve(__dirname, "./"),
    },
  },
});
