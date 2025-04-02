import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const external = [
  "@coral-xyz/borsh",
  "@solana/web3.js",
  "@solana/spl-token",
  "@coral-xyz/anchor"
];

const plugins = [
  commonjs(),
  json(),
  nodeResolve({
    extensions: [".js", ".ts"],
    preferBuiltins: false,
  }),
];

export default [
  // ESM build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/esm",
      format: "es",
      entryFileNames: "[name].mjs",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      ...plugins,
      typescript({
        tsconfig: "./tsconfig.base.json",
        outDir: "./dist/esm",
        outputToFilesystem: false,
		sourceMap: true,
		inlineSources: true,
      }),
    ],
    external,
  },
  // CommonJS build
  {
    input: "src/index.ts",
    output: {
      dir: "dist/cjs",
      format: "cjs",
      entryFileNames: "[name].cjs",
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: "src",
      exports: "named",
    },
    plugins: [
      ...plugins,
      typescript({
        tsconfig: "./tsconfig.base.json",
        outDir: "./dist/cjs",
        outputToFilesystem: false,
		sourceMap: true,
		inlineSources: true,
      }),
    ],
    external,
  },
  // Browser build
  {
    input: "src/index.ts",
    output: {
      file: "dist/browser/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      commonjs(),
      json(),
      nodeResolve({
        browser: true,
        extensions: [".js", ".ts"],
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: "./tsconfig.base.json",
        outDir: "./dist/browser",
        outputToFilesystem: false,
        compilerOptions: {
          module: "ES2022",
          moduleResolution: "bundler"
        }
      }),
    ],
    external,
  },
  // Browser build with external bundle
  {
    input: "src/index.ts",
    output: {
      file: "dist/browser/with-external/index.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      commonjs(),
      json(),
      nodeResolve({
        browser: true,
        extensions: [".js", ".ts"],
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: "./tsconfig.base.json",
        outDir: "./dist/browser/with-external",
        outputToFilesystem: false,
        compilerOptions: {
          module: "ES2022",
          moduleResolution: "bundler"
        }
      }),
    ],
  },
];