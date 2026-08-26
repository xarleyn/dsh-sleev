import { defineConfig } from "tsdown";

export default defineConfig({
  name: "dsh-sleev",
  entry: {
    index: "src/index.ts",
    "shared/telemetry": "src/shared/telemetry.ts",
    "host/optimizer/sleev/headers": "src/host/optimizer/sleev/headers.ts",
  },
  outDir: "lib",
  format: ["esm"],
  platform: "node",
  target: "es2022",
  fixedExtension: false,
  dts: false,
  clean: true,
});
