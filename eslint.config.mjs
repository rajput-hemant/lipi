import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import eslintConfigPrettier from "eslint-config-prettier";
import reactCompiler from "eslint-plugin-react-compiler";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "**/public/**",
    "**/*.esm.js",
  ]),
  ...nextCoreWebVitals,
  eslintConfigPrettier,
  {
    plugins: {
      "react-compiler": reactCompiler,
    },
    rules: {
      "react-compiler/react-compiler": "error",
    },
    settings: {
      next: {
        rootDir: ["./"],
      },
    },
  },
]);
