import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/cli/index.ts"],
  format: "esm",
  dts: true,
  // Keep one output module per source file so each component's "use client"
  // directive survives verbatim (RSC client boundaries) and consumers
  // tree-shake at module granularity.
  unbundle: true,
  outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
  alias: {
    "@": "./src",
  },
});
