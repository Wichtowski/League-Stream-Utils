import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@lsu/types": path.resolve(__dirname, "../types/src"),
    },
  },
  esbuild: {
    tsconfigRaw: "{}",
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
