import { plugin as shadcn } from "@shadcn/lint";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    ".next/**",
    ".claude/worktrees/**",
    "node_modules/**",
    "**/public/**",
    "**/*.esm.js",
    "components/ui/**",
  ]),
  {
    files: ["**/*.{tsx,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { shadcn },
    settings: {
      next: {
        rootDir: ["./"],
      },
      shadcn: {
        note: "Use base-nova components and semantic theme tokens from app/globals.css.",
      },
    },
    rules: {
      "shadcn/no-raw-colors": "error",
      "shadcn/require-static-classes": "error",
    },
  },
  {
    files: ["components/icons.tsx", "app/(lobby)/components/features.tsx"],
    rules: {
      "shadcn/no-raw-colors": "off",
    },
  },
]);
