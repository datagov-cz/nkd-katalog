// @ts-check

import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default defineConfig(
  // Client JavaScript.
  {
    files: ["assets/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    extends: [
      js.configs.recommended,
      prettierConfig,
    ],
  },
  // Server JavaScript.
  {
    files: ["server/**/*.{js,ts,ts,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      prettierConfig,
    ],
  },
);
