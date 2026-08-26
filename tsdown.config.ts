import { defineConfig } from "tsdown";

export default defineConfig({
  name: "dsh-sleev",
  entry: {
    index: "src/index.ts",
    "shared/telemetry": "src/shared/telemetry.ts",
  },
  outDir: "lib",
  format: ["esm"],
  platform: "node",
  target: "es2022",
  fixedExtension: false,
  dts: false,
  clean: true,
});
