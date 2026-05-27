import { defineConfig } from "tsdown";

export default defineConfig({
  workspace: {
    include: ["packages/*"],
  },
  entry: "src/index.ts",
  format: "esm",
  dts: {
    sourcemap: true,
  },
  sourcemap: true,
  clean: true,
  deps: {
    skipNodeModulesBundle: true,
  },
  exports: {
    devExports: true,
  },
});
